import {
  EnrollmentStatus,
  Prisma,
} from "@prisma/client";

import prisma from "../../../config/prisma.js";
import AppError from "../../errors/AppError.js";

import type {
  CreateEnrollmentInput,
  EnrollmentQueryInput,
  UpdateEnrollmentStatusInput,
} from "./enrollment.validation.js";

const enrollmentPublicSelect = {
  id: true,
  studentId: true,
  courseId: true,
  status: true,
  enrolledAt: true,
  completedAt: true,
  createdAt: true,
  updatedAt: true,

  student: {
    select: {
      id: true,
      studentId: true,
      semester: true,
      batch: true,
      user: {
        select: {
          id: true,
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
      semester: true,
      capacity: true,
      isActive: true,
      department: {
        select: {
          id: true,
          name: true,
          code: true,
        },
      },
    },
  },
} satisfies Prisma.EnrollmentSelect;

const getStudentProfile = async (userId: string) => {
  const student = await prisma.student.findFirst({
    where: {
      userId,
      user: {
        deletedAt: null,
      },
    },
    select: {
      id: true,
      studentId: true,
    },
  });

  if (!student) {
    throw new AppError(
      404,
      "Student profile not found",
    );
  }

  return student;
};

const createEnrollment = async (
  userId: string,
  payload: CreateEnrollmentInput,
) => {
  const student = await getStudentProfile(userId);

  return prisma.$transaction(
    async (tx) => {
      const course = await tx.course.findFirst({
        where: {
          id: payload.courseId,
          deletedAt: null,
        },
        select: {
          id: true,
          isActive: true,
          capacity: true,
        },
      });

      if (!course) {
        throw new AppError(404, "Course not found");
      }

      if (!course.isActive) {
        throw new AppError(
          400,
          "This course is currently inactive",
        );
      }

      const existingEnrollment =
        await tx.enrollment.findUnique({
          where: {
            studentId_courseId: {
              studentId: student.id,
              courseId: course.id,
            },
          },
          select: {
            id: true,
            status: true,
          },
        });

      if (existingEnrollment) {
        throw new AppError(
          409,
          "You have already enrolled in this course",
        );
      }

      const enrolledCount = await tx.enrollment.count({
        where: {
          courseId: course.id,
          status: EnrollmentStatus.APPROVED,
        },
      });

      if (enrolledCount >= course.capacity) {
        throw new AppError(
          409,
          "Course capacity is full",
        );
      }

      try {
        return await tx.enrollment.create({
          data: {
            studentId: student.id,
            courseId: course.id,
            status: EnrollmentStatus.PENDING,
          },
          select: enrollmentPublicSelect,
        });
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === "P2002"
        ) {
          throw new AppError(
            409,
            "You have already enrolled in this course",
          );
        }

        throw error;
      }
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    },
  );
};

const getEnrollmentById = async (id: string) => {
  const enrollment = await prisma.enrollment.findUnique({
    where: {
      id,
    },
    select: enrollmentPublicSelect,
  });

  if (!enrollment) {
    throw new AppError(404, "Enrollment not found");
  }

  return enrollment;
};

const getMyEnrollments = async (
  userId: string,
  query: EnrollmentQueryInput,
) => {
  const student = await getStudentProfile(userId);

  return getEnrollments({
    ...query,
    studentId: student.id,
  });
};

const getEnrollments = async (
  query: EnrollmentQueryInput,
) => {
  const {
    page,
    limit,
    status,
    courseId,
    studentId,
    sortOrder,
  } = query;

  const skip = (page - 1) * limit;

  const where: Prisma.EnrollmentWhereInput = {
    ...(status && {
      status: status as EnrollmentStatus,
    }),
    ...(courseId && {
      courseId,
    }),
    ...(studentId && {
      studentId,
    }),
  };

  const [total, enrollments] = await prisma.$transaction([
    prisma.enrollment.count({
      where,
    }),

    prisma.enrollment.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        createdAt: sortOrder,
      },
      select: enrollmentPublicSelect,
    }),
  ]);

  return {
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    data: enrollments,
  };
};

const updateEnrollmentStatus = async (
  id: string,
  payload: UpdateEnrollmentStatusInput,
) => {
  const enrollment = await prisma.enrollment.findUnique({
    where: {
      id,
    },
    select: {
      id: true,
      status: true,
    },
  });

  if (!enrollment) {
    throw new AppError(404, "Enrollment not found");
  }

  if (enrollment.status !== EnrollmentStatus.PENDING) {
    throw new AppError(
      400,
      "Only pending enrollments can be reviewed",
    );
  }

  const updatedEnrollment = await prisma.enrollment.update({
    where: {
      id,
    },
    data: {
      status: payload.status as EnrollmentStatus,
    },
    select: enrollmentPublicSelect,
  });

  return updatedEnrollment;
};

const cancelMyEnrollment = async (
  userId: string,
  id: string,
) => {
  const student = await getStudentProfile(userId);

  const enrollment = await prisma.enrollment.findFirst({
    where: {
      id,
      studentId: student.id,
    },
    select: {
      id: true,
      status: true,
    },
  });

  if (!enrollment) {
    throw new AppError(404, "Enrollment not found");
  }

  if (enrollment.status !== EnrollmentStatus.PENDING) {
    throw new AppError(
      400,
      "Only pending enrollments can be cancelled",
    );
  }

  await prisma.enrollment.update({
    where: {
      id,
    },
    data: {
      status: EnrollmentStatus.DROPPED,
    },
  });

  return null;
};

export const enrollmentService = {
  createEnrollment,
  getEnrollmentById,
  getMyEnrollments,
  getEnrollments,
  updateEnrollmentStatus,
  cancelMyEnrollment,
};