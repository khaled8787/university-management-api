
import { Grade, Prisma } from "@prisma/client";
import prisma from "../../../config/prisma.js";
import AppError from "../../errors/AppError.js";
import type {
  CreateResultInput,
  ResultQueryInput,
  UpdateResultInput,
} from "./result.validation.js";

const resultSelect = {
  id: true,
  studentId: true,
  courseId: true,
  facultyId: true,
  marks: true,
  grade: true,
  gradePoint: true,
  remarks: true,
  createdAt: true,
  updatedAt: true,

  student: {
    select: {
      id: true,
      studentId: true,
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  },

  course: {
    select: {
      id: true,
      code: true,
      title: true,
      credit: true,
    },
  },

  faculty: {
    select: {
      id: true,
      employeeId: true,
      user: {
        select: {
          name: true,
        },
      },
    },
  },
} satisfies Prisma.ResultSelect;

const calculateGrade = (marks: number) => {
  if (marks >= 80) return { grade: "A_PLUS", gradePoint: 4.0 };
  if (marks >= 75) return { grade: "A", gradePoint: 3.75 };
  if (marks >= 70) return { grade: "A_MINUS", gradePoint: 3.5 };
  if (marks >= 65) return { grade: "B_PLUS", gradePoint: 3.25 };
  if (marks >= 60) return { grade: "B", gradePoint: 3.0 };
  if (marks >= 55) return { grade: "B_MINUS", gradePoint: 2.75 };
  if (marks >= 50) return { grade: "C_PLUS", gradePoint: 2.5 };
  if (marks >= 45) return { grade: "C", gradePoint: 2.25 };
  if (marks >= 40) return { grade: "D", gradePoint: 2.0 };

  return { grade: "F", gradePoint: 0.0 };
};

const getFacultyProfile = async (userId: string) => {
  const faculty = await prisma.faculty.findFirst({
    where: {
      userId,
      deletedAt: null,
      user: { deletedAt: null },
      department: { deletedAt: null },
    },
    select: { id: true },
  });

  if (!faculty) {
    throw new AppError(404, "Faculty profile not found");
  }

  return faculty;
};

const verifyStudentAndCourse = async (
  studentId: string,
  courseId: string,
) => {
  const [student, course] = await Promise.all([
    prisma.student.findFirst({
      where: {
        id: studentId,
        deletedAt: null,
        user: { deletedAt: null },
        department: { deletedAt: null },
      },
      select: { id: true },
    }),

    prisma.course.findFirst({
      where: {
        id: courseId,
        deletedAt: null,
        department: { deletedAt: null },
      },
      select: {
        id: true,
        facultyId: true,
        isActive: true,
      },
    }),
  ]);

  if (!student) {
    throw new AppError(404, "Student not found");
  }

  if (!course) {
    throw new AppError(404, "Course not found");
  }

  if (!course.isActive) {
    throw new AppError(400, "This course is inactive");
  }

  if (course.facultyId) {
    const faculty = await prisma.faculty.findFirst({
      where: {
        id: course.facultyId,
        deletedAt: null,
        user: { deletedAt: null },
        department: { deletedAt: null },
      },
      select: { id: true },
    });

    if (!faculty) {
      throw new AppError(
        400,
        "The faculty assigned to this course is no longer active",
      );
    }
  }

  return course;
};

const createResult = async (
  userId: string,
  role: string,
  payload: CreateResultInput,
) => {
  const course = await verifyStudentAndCourse(
    payload.studentId,
    payload.courseId,
  );

  let facultyId: string;

  if (role === "ADMIN") {
    if (!course.facultyId) {
      throw new AppError(400, "No faculty is assigned to this course");
    }

    facultyId = course.facultyId;
  } else {
    const faculty = await getFacultyProfile(userId);

    if (course.facultyId !== faculty.id) {
      throw new AppError(
        403,
        "You can manage results only for your assigned courses",
      );
    }

    facultyId = faculty.id;
  }

  const existingResult = await prisma.result.findFirst({
    where: {
      studentId: payload.studentId,
      courseId: payload.courseId,
      deletedAt: null,
    },
  });

  if (existingResult) {
    throw new AppError(
      409,
      "Result already exists for this student in this course",
    );
  }

  const grading = calculateGrade(payload.marks);

  return prisma.result.create({
    data: {
      studentId: payload.studentId,
      courseId: payload.courseId,
      facultyId,
      marks: payload.marks,
      grade: grading.grade as Grade,
      gradePoint: grading.gradePoint,
      remarks: payload.remarks,
    },
    select: resultSelect,
  });
};

/**
 * Optional enforcedFacultyId is set only by the authenticated
 * Faculty endpoint. Client-supplied facultyId cannot override it.
 */
const getResults = async (
  query: ResultQueryInput,
  enforcedFacultyId?: string,
) => {
  const { page, limit, studentId, courseId, facultyId, sortOrder } = query;

  const effectiveFacultyId = enforcedFacultyId ?? facultyId;

  const where: Prisma.ResultWhereInput = {
    deletedAt: null,

    ...(studentId && { studentId }),
    ...(courseId && { courseId }),
    ...(effectiveFacultyId && { facultyId: effectiveFacultyId }),

    student: {
      deletedAt: null,
      user: { deletedAt: null },
      department: { deletedAt: null },
    },

    course: {
      deletedAt: null,
      department: { deletedAt: null },
      ...(enforcedFacultyId && { facultyId: enforcedFacultyId }),
    },

    faculty: {
      deletedAt: null,
      user: { deletedAt: null },
      department: { deletedAt: null },
    },
  };

  const [total, data] = await prisma.$transaction([
    prisma.result.count({ where }),

    prisma.result.findMany({
      where,
      select: resultSelect,
      orderBy: { createdAt: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return {
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    data,
  };
};

// Admin: results matching the supplied filters.
const getAllResults = async (query: ResultQueryInput) => {
  return getResults(query);
};

// Faculty: results from currently assigned courses only.
const getFacultyResults = async (
  userId: string,
  query: ResultQueryInput,
) => {
  const faculty = await getFacultyProfile(userId);

  return getResults(query, faculty.id);
};

// Student: own results only.
const getMyResults = async (
  userId: string,
  query: ResultQueryInput,
) => {
  const student = await prisma.student.findFirst({
    where: {
      userId,
      deletedAt: null,
      user: { deletedAt: null },
      department: { deletedAt: null },
    },
    select: { id: true },
  });

  if (!student) {
    throw new AppError(404, "Student profile not found");
  }

  return getResults(
    { ...query, studentId: student.id },
  );
};

const getResultById = async (id: string) => {
  const result = await prisma.result.findFirst({
    where: {
      id,
      deletedAt: null,

      student: {
        deletedAt: null,
        user: { deletedAt: null },
        department: { deletedAt: null },
      },

      course: {
        deletedAt: null,
        department: { deletedAt: null },
      },

      faculty: {
        deletedAt: null,
        user: { deletedAt: null },
        department: { deletedAt: null },
      },
    },
    select: resultSelect,
  });

  if (!result) {
    throw new AppError(404, "Result not found");
  }

  return result;
};

const updateResult = async (
  userId: string,
  role: string,
  id: string,
  payload: UpdateResultInput,
) => {
  const existingResult = await prisma.result.findFirst({
    where: {
      id,
      deletedAt: null,

      student: {
        deletedAt: null,
        user: { deletedAt: null },
        department: { deletedAt: null },
      },

      course: {
        deletedAt: null,
        department: { deletedAt: null },
      },

      faculty: {
        deletedAt: null,
        user: { deletedAt: null },
        department: { deletedAt: null },
      },
    },
    include: {
      course: {
        select: { facultyId: true },
      },
    },
  });

  if (!existingResult) {
    throw new AppError(404, "Result not found");
  }

  if (role !== "ADMIN") {
    const faculty = await getFacultyProfile(userId);

    if (
      existingResult.facultyId !== faculty.id ||
      existingResult.course.facultyId !== faculty.id
    ) {
      throw new AppError(
        403,
        "You can update only results of your assigned courses",
      );
    }
  }

  const grading =
    payload.marks !== undefined
      ? calculateGrade(payload.marks)
      : {
          grade: existingResult.grade,
          gradePoint: existingResult.gradePoint,
        };

  return prisma.result.update({
    where: { id },
    data: {
      ...(payload.marks !== undefined && {
        marks: payload.marks,
        grade: grading.grade as Grade,
        gradePoint: grading.gradePoint,
      }),
      ...(payload.remarks !== undefined && {
        remarks: payload.remarks,
      }),
    },
    select: resultSelect,
  });
};

const deleteResult = async (
  userId: string,
  role: string,
  id: string,
) => {
  const existingResult = await prisma.result.findFirst({
    where: {
      id,
      deletedAt: null,

      student: {
        deletedAt: null,
        user: { deletedAt: null },
        department: { deletedAt: null },
      },

      course: {
        deletedAt: null,
        department: { deletedAt: null },
      },

      faculty: {
        deletedAt: null,
        user: { deletedAt: null },
        department: { deletedAt: null },
      },
    },
    select: {
      id: true,
      facultyId: true,
      course: {
        select: { facultyId: true },
      },
    },
  });

  if (!existingResult) {
    throw new AppError(404, "Result not found");
  }

  if (role !== "ADMIN") {
    const faculty = await getFacultyProfile(userId);

    if (
      existingResult.facultyId !== faculty.id ||
      existingResult.course.facultyId !== faculty.id
    ) {
      throw new AppError(
        403,
        "You can delete only results of your assigned courses",
      );
    }
  }

  const deletedAt = new Date();

  return prisma.result.update({
    where: { id },
    data: { deletedAt },
    select: {
      id: true,
      deletedAt: true,
    },
  });
};

export const resultService = {
  createResult,
  getResults,
  getAllResults,
  getFacultyResults,
  getMyResults,
  getResultById,
  updateResult,
  deleteResult,
};
