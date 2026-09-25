import { Prisma } from "@prisma/client";

import prisma from "../../../config/prisma.js";
import AppError from "../../errors/AppError.js";

import type {
  FacultyQueryInput,
  UpdateFacultyInput,
} from "./faculty.validation.js";

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

const getFacultyById = async (id: string) => {
  const faculty = await prisma.faculty.findFirst({
    where: {
      id,
      user: {
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

const getAllFaculties = async (query: FacultyQueryInput) => {
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
    user: {
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

  const [total, faculties] = await prisma.$transaction([
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

const updateFaculty = async (
  id: string,
  payload: UpdateFacultyInput,
) => {
  await getFacultyById(id);

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

  const updatedFaculty = await prisma.faculty.update({
    where: {
      id,
    },

    data: payload,

    select: facultyPublicSelect,
  });

  return updatedFaculty;
};

const deleteFaculty = async (id: string) => {
  const faculty = await getFacultyById(id);

  await prisma.user.update({
    where: {
      id: faculty.user.id,
    },

    data: {
      deletedAt: new Date(),
    },
  });

  return null;
};

export const facultyService = {
  getFacultyById,
  getAllFaculties,
  updateFaculty,
  deleteFaculty,
};