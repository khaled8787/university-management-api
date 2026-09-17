import { Prisma } from "@prisma/client";

import prisma from "../../../config/prisma.js";
import AppError from "../../errors/AppError.js";

import type {
  CreateCourseInput,
  CourseQueryInput,
  UpdateCourseInput,
} from "./course.validation.js";

const coursePublicSelect = {
  id: true,
  code: true,
  title: true,
  description: true,
  credit: true,
  departmentId: true,
  facultyId: true,
  semester: true,
  capacity: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,

  department: {
    select: {
      id: true,
      name: true,
      code: true,
    },
  },

  faculty: {
    select: {
      id: true,
      employeeId: true,
      designation: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  },

  _count: {
    select: {
      enrollments: true,
      attendances: true,
      results: true,
    },
  },
} satisfies Prisma.CourseSelect;

const validateAcademicRelations = async (
  departmentId: string,
  facultyId?: string | null,
) => {
  const department = await prisma.department.findFirst({
    where: {
      id: departmentId,
      deletedAt: null,
    },
    select: {
      id: true,
    },
  });

  if (!department) {
    throw new AppError(404, "Department not found");
  }

  if (facultyId) {
    const faculty = await prisma.faculty.findFirst({
      where: {
        id: facultyId,
        user: {
          deletedAt: null,
        },
        departmentId,
      },
      select: {
        id: true,
      },
    });

    if (!faculty) {
      throw new AppError(
        400,
        "Faculty does not belong to the selected department",
      );
    }
  }
};

const ensureUniqueCourseCode = async (
  code: string,
  excludedId?: string,
) => {
  const existingCourse = await prisma.course.findFirst({
    where: {
      code,
      deletedAt: null,
      ...(excludedId && {
        NOT: {
          id: excludedId,
        },
      }),
    },
    select: {
      id: true,
    },
  });

  if (existingCourse) {
    throw new AppError(409, "Course code already exists");
  }
};

const getCourseById = async (id: string) => {
  const course = await prisma.course.findFirst({
    where: {
      id,
      deletedAt: null,
    },
    select: coursePublicSelect,
  });

  if (!course) {
    throw new AppError(404, "Course not found");
  }

  return course;
};

const createCourse = async (payload: CreateCourseInput) => {
  await ensureUniqueCourseCode(payload.code);

  await validateAcademicRelations(
    payload.departmentId,
    payload.facultyId,
  );

  const course = await prisma.course.create({
    data: {
      code: payload.code,
      title: payload.title,
      description: payload.description,
      credit: payload.credit,
      departmentId: payload.departmentId,
      facultyId: payload.facultyId,
      semester: payload.semester,
      capacity: payload.capacity,
    },
    select: coursePublicSelect,
  });

  return course;
};

const getAllCourses = async (query: CourseQueryInput) => {
  const {
    page,
    limit,
    search,
    departmentId,
    facultyId,
    semester,
    isActive,
    sortBy,
    sortOrder,
  } = query;

  const skip = (page - 1) * limit;

  const where: Prisma.CourseWhereInput = {
    deletedAt: null,

    ...(departmentId && {
      departmentId,
    }),

    ...(facultyId && {
      facultyId,
    }),

    ...(semester && {
      semester,
    }),

    ...(isActive !== undefined && {
      isActive,
    }),

    ...(search && {
      OR: [
        {
          code: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          title: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          description: {
            contains: search,
            mode: "insensitive",
          },
        },
      ],
    }),
  };

  const [total, courses] = await prisma.$transaction([
    prisma.course.count({
      where,
    }),

    prisma.course.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        [sortBy]: sortOrder,
      },
      select: coursePublicSelect,
    }),
  ]);

  return {
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    data: courses,
  };
};

const updateCourse = async (
  id: string,
  payload: UpdateCourseInput,
) => {
  await getCourseById(id);

  if (payload.code) {
    await ensureUniqueCourseCode(payload.code, id);
  }

  const currentCourse = await prisma.course.findUnique({
    where: {
      id,
    },
    select: {
      departmentId: true,
      facultyId: true,
    },
  });

  if (!currentCourse) {
    throw new AppError(404, "Course not found");
  }

  const departmentId =
    payload.departmentId ?? currentCourse.departmentId;

  const facultyId =
    payload.facultyId === undefined
      ? currentCourse.facultyId
      : payload.facultyId;

  await validateAcademicRelations(departmentId, facultyId);

  if (payload.capacity !== undefined) {
    const enrollmentCount = await prisma.enrollment.count({
      where: {
        courseId: id,
        status: {
          in: ["PENDING", "APPROVED"],
        },
      },
    });

    if (payload.capacity < enrollmentCount) {
      throw new AppError(
        400,
        `Capacity cannot be less than current enrollment count: ${enrollmentCount}`,
      );
    }
  }

  const updatedCourse = await prisma.course.update({
    where: {
      id,
    },
    data: payload,
    select: coursePublicSelect,
  });

  return updatedCourse;
};

const updateCourseStatus = async (
  id: string,
  isActive: boolean,
) => {
  await getCourseById(id);

  const course = await prisma.course.update({
    where: {
      id,
    },
    data: {
      isActive,
    },
    select: coursePublicSelect,
  });

  return course;
};

const deleteCourse = async (id: string) => {
  const course = await getCourseById(id);

  if (
    course._count.enrollments > 0 ||
    course._count.attendances > 0 ||
    course._count.results > 0
  ) {
    throw new AppError(
      409,
      "This course cannot be deleted because academic records exist",
    );
  }

  await prisma.course.update({
    where: {
      id,
    },
    data: {
      deletedAt: new Date(),
      isActive: false,
    },
  });

  return null;
};

export const courseService = {
  createCourse,
  getCourseById,
  getAllCourses,
  updateCourse,
  updateCourseStatus,
  deleteCourse,
};