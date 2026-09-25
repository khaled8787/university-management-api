import { Prisma } from "@prisma/client";

import prisma from "../../../config/prisma.js";
import AppError from "../../errors/AppError.js";

import type {
  FacultyQueryInput,
  UpdateFacultyInput,
} from "./faculty.validation.js";

// ============================================================
// FACULTY PUBLIC SELECT
// ============================================================

const facultyPublicSelect = {
  id: true,
  employeeId: true,
  designation: true,
  phone: true,
  specialization: true,
  departmentId: true,
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

  _count: {
    select: {
      courses: true,
      attendances: true,
      results: true,
    },
  },
} satisfies Prisma.FacultySelect;

// ============================================================
// GET SINGLE FACULTY
// ============================================================

const getFacultyById = async (id: string) => {
  const faculty = await prisma.faculty.findFirst({
    where: {
      id,

      // Faculty itself must not be soft deleted
      deletedAt: null,

      // Related user must not be soft deleted
      user: {
        deletedAt: null,
      },

      // Related department must not be soft deleted
      department: {
        deletedAt: null,
      },
    },

    select: facultyPublicSelect,
  });

  if (!faculty) {
    throw new AppError(404, "Faculty not found");
  }

  return faculty;
};

// ============================================================
// GET ALL FACULTIES
// ============================================================

const getAllFaculties = async (
  query: FacultyQueryInput,
) => {
  const {
    page,
    limit,
    search,
    departmentId,
    designation,
    specialization,
    sortBy,
    sortOrder,
  } = query;

  const skip = (page - 1) * limit;

  const where: Prisma.FacultyWhereInput = {
    // Exclude soft-deleted faculties
    deletedAt: null,

    // Exclude soft-deleted users
    user: {
      deletedAt: null,
    },

    // Exclude soft-deleted departments
    department: {
      deletedAt: null,
    },

    ...(departmentId && {
      departmentId,
    }),

    ...(designation && {
      designation: {
        contains: designation,
        mode: "insensitive",
      },
    }),

    ...(specialization && {
      specialization: {
        contains: specialization,
        mode: "insensitive",
      },
    }),

    ...(search && {
      OR: [
        {
          employeeId: {
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

        {
          specialization: {
            contains: search,
            mode: "insensitive",
          },
        },
      ],
    }),
  };

  // ==========================================================
  // SORTING
  // ==========================================================

  let orderBy: Prisma.FacultyOrderByWithRelationInput;

  if (sortBy === "name") {
    orderBy = {
      user: {
        name: sortOrder,
      },
    };
  } else {
    orderBy = {
      [sortBy]: sortOrder,
    } as Prisma.FacultyOrderByWithRelationInput;
  }

  // ==========================================================
  // PAGINATION + DATA
  // ==========================================================

  const [total, faculties] =
    await prisma.$transaction([
      prisma.faculty.count({
        where,
      }),

      prisma.faculty.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        select: facultyPublicSelect,
      }),
    ]);

  return {
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },

    data: faculties,
  };
};

// ============================================================
// UPDATE FACULTY
// ============================================================

const updateFaculty = async (
  id: string,
  payload: UpdateFacultyInput,
) => {
  // Make sure faculty exists and is not deleted
  await getFacultyById(id);

  // ----------------------------------------------------------
  // Validate department if departmentId is being changed
  // ----------------------------------------------------------

  if (payload.departmentId) {
    const department =
      await prisma.department.findFirst({
        where: {
          id: payload.departmentId,
          deletedAt: null,
        },

        select: {
          id: true,
        },
      });

    if (!department) {
      throw new AppError(
        404,
        "Department not found",
      );
    }
  }

  // ----------------------------------------------------------
  // Update faculty
  // ----------------------------------------------------------

  const updatedFaculty =
    await prisma.faculty.update({
      where: {
        id,
      },

      data: payload,

      select: facultyPublicSelect,
    });

  return updatedFaculty;
};

// ============================================================
// DELETE FACULTY - SOFT DELETE
// ============================================================

const deleteFaculty = async (id: string) => {
  // ----------------------------------------------------------
  // Make sure faculty exists
  // ----------------------------------------------------------

  const faculty = await getFacultyById(id);

  // ----------------------------------------------------------
  // Use one timestamp for Faculty + User
  // ----------------------------------------------------------

  const deletedAt = new Date();

  // ----------------------------------------------------------
  // Soft delete Faculty + User atomically
  // ----------------------------------------------------------

  await prisma.$transaction([
    prisma.faculty.update({
      where: {
        id: faculty.id,
      },

      data: {
        deletedAt,
      },
    }),

    prisma.user.update({
      where: {
        id: faculty.user.id,
      },

      data: {
        deletedAt,
      },
    }),
  ]);

  return {
    facultyId: faculty.id,
    deletedAt,
  };
};

// ============================================================
// EXPORT
// ============================================================

export const facultyService = {
  getFacultyById,
  getAllFaculties,
  updateFaculty,
  deleteFaculty,
};