import { Prisma } from "@prisma/client";

import prisma from "../../../config/prisma.js";
import AppError from "../../errors/AppError.js";
import type {
  StudentQueryInput,
  UpdateStudentInput,
} from "./student.validation.js";

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
// GET SINGLE STUDENT
// ============================================================

const getStudentById = async (id: string) => {
  const student = await prisma.student.findFirst({
    where: {
      id,
      user: {
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
// GET ALL STUDENTS
// ============================================================

const getAllStudents = async (
  query: StudentQueryInput,
) => {
  const {
    page,
    limit,
    search,
    departmentId,
    semester,
    sortBy,
    sortOrder,
  } = query;

  const skip = (page - 1) * limit;

  const where: Prisma.StudentWhereInput = {
    user: {
      deletedAt: null,
    },

    ...(departmentId && {
      departmentId,
    }),

    ...(semester && {
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
// UPDATE STUDENT
// ============================================================

const updateStudent = async (
  id: string,
  payload: UpdateStudentInput,
) => {
  // Make sure student exists
  await getStudentById(id);

  // Validate department if departmentId is being changed
  if (payload.departmentId) {
    const department =
      await prisma.department.findFirst({
        where: {
          id: payload.departmentId,
          deletedAt: null,
        },
      });

    if (!department) {
      throw new AppError(
        404,
        "Department not found",
      );
    }
  }

  const updatedStudent =
    await prisma.student.update({
      where: {
        id,
      },

      data: payload,

      select: studentPublicSelect,
    });

  return updatedStudent;
};

// ============================================================
// DELETE STUDENT - SOFT DELETE
// ============================================================

const deleteStudent = async (id: string) => {
  const student = await getStudentById(id);

  await prisma.user.update({
    where: {
      id: student.user.id,
    },

    data: {
      deletedAt: new Date(),
    },
  });

  return null;
};

export const studentService = {
  getStudentById,
  getAllStudents,
  updateStudent,
  deleteStudent,
};