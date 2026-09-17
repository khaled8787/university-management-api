import { Prisma } from "@prisma/client";

import prisma from "../../../config/prisma.js";
import AppError from "../../errors/AppError.js";

import type {
  CreateDepartmentInput,
  DepartmentQueryInput,
  UpdateDepartmentInput,
} from "./department.validation.js";

const getDepartmentById = async (id: string) => {
  const department = await prisma.department.findFirst({
    where: {
      id,
      deletedAt: null,
    },
    include: {
      _count: {
        select: {
          students: true,
          faculties: true,
          courses: true,
        },
      },
    },
  });

  if (!department) {
    throw new AppError(404, "Department not found");
  }

  return department;
};

const createDepartment = async (payload: CreateDepartmentInput) => {
  const existingDepartment = await prisma.department.findFirst({
    where: {
      OR: [
        {
          name: {
            equals: payload.name,
            mode: "insensitive",
          },
        },
        {
          code: {
            equals: payload.code,
            mode: "insensitive",
          },
        },
      ],
      deletedAt: null,
    },
  });

  if (existingDepartment) {
    throw new AppError(
      409,
      "A department with this name or code already exists",
    );
  }

  return prisma.department.create({
    data: {
      name: payload.name,
      code: payload.code,
      description: payload.description,
    },
  });
};

const getAllDepartments = async (query: DepartmentQueryInput) => {
  const {
    page,
    limit,
    search,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = query;

  const skip = (page - 1) * limit;

  const where: Prisma.DepartmentWhereInput = {
    deletedAt: null,
    ...(search
      ? {
          OR: [
            {
              name: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              code: {
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
        }
      : {}),
  };

  const [departments, total] = await prisma.$transaction([
    prisma.department.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        [sortBy]: sortOrder,
      },
      include: {
        _count: {
          select: {
            students: true,
            faculties: true,
            courses: true,
          },
        },
      },
    }),

    prisma.department.count({ where }),
  ]);

  return {
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    data: departments,
  };
};

const updateDepartment = async (
  id: string,
  payload: UpdateDepartmentInput,
) => {
  await getDepartmentById(id);

  if (payload.name || payload.code) {
    const duplicateDepartment = await prisma.department.findFirst({
      where: {
        id: {
          not: id,
        },
        deletedAt: null,
        OR: [
          ...(payload.name
            ? [
                {
                  name: {
                    equals: payload.name,
                    mode: "insensitive" as const,
                  },
                },
              ]
            : []),
          ...(payload.code
            ? [
                {
                  code: {
                    equals: payload.code,
                    mode: "insensitive" as const,
                  },
                },
              ]
            : []),
        ],
      },
    });

    if (duplicateDepartment) {
      throw new AppError(
        409,
        "Another department with this name or code already exists",
      );
    }
  }

  return prisma.department.update({
    where: { id },
    data: payload,
  });
};

const deleteDepartment = async (id: string) => {
  const department = await getDepartmentById(id);

  const [studentCount, facultyCount, courseCount] = await Promise.all([
    prisma.student.count({
      where: {
        departmentId: id,
      },
    }),

    prisma.faculty.count({
      where: {
        departmentId: id,
      },
    }),

    prisma.course.count({
      where: {
        departmentId: id,
        deletedAt: null,
      },
    }),
  ]);

  if (studentCount > 0 || facultyCount > 0 || courseCount > 0) {
    throw new AppError(
      409,
      "Cannot delete a department that has students, faculties, or courses",
      [
        {
          studentCount,
          facultyCount,
          courseCount,
        },
      ],
    );
  }

  return prisma.department.update({
    where: {
      id: department.id,
    },
    data: {
      deletedAt: new Date(),
    },
  });
};

export const departmentService = {
  createDepartment,
  getAllDepartments,
  getDepartmentById,
  updateDepartment,
  deleteDepartment,
};