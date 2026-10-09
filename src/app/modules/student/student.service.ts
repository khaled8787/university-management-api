
import { Prisma } from "@prisma/client";

import prisma from "../../../config/prisma.js";
import AppError from "../../errors/AppError.js";

import type {
  StudentQueryInput,
  UpdateStudentInput,
} from "./student.validation.js";

// ============================================================
// STUDENT PUBLIC SELECT
// ============================================================

const studentPublicSelect = {
  id: true,
  studentId: true,
  semester: true,
  batch: true,
  phone: true,
  dateOfBirth: true,
  address: true,
  createdAt: true,
  updatedAt: true,

  user: {
    select: {
      id: true,
      name: true,
      email: true,
      status: true,
      profileImage: true,
    },
  },

  department: {
    select: {
      id: true,
      name: true,
      code: true,
    },
  },
} satisfies Prisma.StudentSelect;

// ============================================================
// GET FACULTY PROFILE
// ============================================================

const getFacultyProfile = async (userId: string) => {
  const faculty = await prisma.faculty.findFirst({
    where: {
      userId,
      deletedAt: null,
      user: {
        deletedAt: null,
      },
      department: {
        deletedAt: null,
      },
    },
    select: {
      id: true,
    },
  });

  if (!faculty) {
    throw new AppError(404, "Faculty profile not found");
  }

  return faculty;
};

// ============================================================
// COMMON STUDENT FILTERS
// ============================================================

const buildStudentWhere = (
  query: StudentQueryInput,
  facultyId?: string,
): Prisma.StudentWhereInput => {
  const {
    search,
    departmentId,
    semester,
  } = query;

  return {
    deletedAt: null,

    user: {
      deletedAt: null,
    },

    department: {
      deletedAt: null,
    },

    ...(facultyId && {
      enrollments: {
        some: {
          deletedAt: null,

          status: {
            in: ["APPROVED", "COMPLETED"],
          },

          course: {
            deletedAt: null,
            isActive: true,
            facultyId,

            department: {
              deletedAt: null,
            },
          },
        },
      },
    }),

    ...(departmentId && {
      departmentId,
    }),

    ...(semester !== undefined && {
      semester,
    }),

    ...(search && {
      OR: [
        {
          studentId: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          user: {
            name: {
              contains: search,
              mode: "insensitive",
            },
          },
        },
        {
          user: {
            email: {
              contains: search,
              mode: "insensitive",
            },
          },
        },
      ],
    }),
  };
};

// ============================================================
// COMMON STUDENT LIST
// ============================================================

const getStudentsByFilter = async (
  query: StudentQueryInput,
  facultyId?: string,
) => {
  const {
    page,
    limit,
    sortBy,
    sortOrder,
  } = query;

  const skip = (page - 1) * limit;

  const where = buildStudentWhere(query, facultyId);

  let orderBy: Prisma.StudentOrderByWithRelationInput;

  if (sortBy === "name") {
    orderBy = {
      user: {
        name: sortOrder,
      },
    };
  } else {
    orderBy = {
      [sortBy]: sortOrder,
    } as Prisma.StudentOrderByWithRelationInput;
  }

  const [total, students] = await prisma.$transaction([
    prisma.student.count({
      where,
    }),

    prisma.student.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      select: studentPublicSelect,
    }),
  ]);

  return {
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    data: students,
  };
};

// ============================================================
// GET SINGLE STUDENT
// ============================================================

const getStudentById = async (id: string) => {
  const student = await prisma.student.findFirst({
    where: {
      id,
      deletedAt: null,

      user: {
        deletedAt: null,
      },

      department: {
        deletedAt: null,
      },
    },
    select: studentPublicSelect,
  });

  if (!student) {
    throw new AppError(404, "Student not found");
  }

  return student;
};

// ============================================================
// GET ALL STUDENTS — ADMIN
// ============================================================

const getAllStudents = async (
  query: StudentQueryInput,
) => {
  return getStudentsByFilter(query);
};

// ============================================================
// GET STUDENTS ENROLLED IN FACULTY'S COURSES
// ============================================================

const getFacultyStudents = async (
  userId: string,
  query: StudentQueryInput,
) => {
  const faculty = await getFacultyProfile(userId);

  return getStudentsByFilter(query, faculty.id);
};

// ============================================================
// UPDATE STUDENT — EXISTING ADMIN FUNCTIONALITY
// ============================================================

const updateStudent = async (
  id: string,
  payload: UpdateStudentInput,
) => {
  await getStudentById(id);

  if (payload.departmentId) {
    const department = await prisma.department.findFirst({
      where: {
        id: payload.departmentId,
        deletedAt: null,
      },
      select: {
        id: true,
      },
    });

    if (!department) {
      throw new AppError(404, "Department not found");
    }
  }

  return prisma.student.update({
    where: {
      id,
    },
    data: payload,
    select: studentPublicSelect,
  });
};

// ============================================================
// DELETE STUDENT — EXISTING ADMIN FUNCTIONALITY
// ============================================================

const deleteStudent = async (id: string) => {
  const student = await getStudentById(id);
  const deletedAt = new Date();

  await prisma.$transaction([
    prisma.student.update({
      where: {
        id: student.id,
      },
      data: {
        deletedAt,
      },
    }),

    prisma.user.update({
      where: {
        id: student.user.id,
      },
      data: {
        deletedAt,
      },
    }),
  ]);

  return {
    studentId: student.id,
    deletedAt,
  };
};

// ============================================================
// EXPORT
// ============================================================

export const studentService = {
  getStudentById,
  getAllStudents,
  getFacultyStudents,
  updateStudent,
  deleteStudent,
};
