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

// ============================================================
// ENROLLMENT PUBLIC SELECT
// ============================================================

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

// ============================================================
// GET STUDENT PROFILE
// ============================================================

const getStudentProfile = async (
  userId: string,
) => {
  const student = await prisma.student.findFirst({
    where: {
      userId,

      // Student must not be soft deleted
      deletedAt: null,

      // User must not be soft deleted
      user: {
        deletedAt: null,
      },

      // Department must not be soft deleted
      department: {
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

// ============================================================
// CREATE ENROLLMENT
// ============================================================

const createEnrollment = async (
  userId: string,
  payload: CreateEnrollmentInput,
) => {
  const student = await getStudentProfile(userId);

  return prisma.$transaction(
    async (tx) => {
      // --------------------------------------------------------
      // Find active course
      // --------------------------------------------------------

      const course =
        await tx.course.findFirst({
          where: {
            id: payload.courseId,

            // Course must not be soft deleted
            deletedAt: null,

            // Department must not be soft deleted
            department: {
              deletedAt: null,
            },
          },

          select: {
            id: true,
            isActive: true,
            capacity: true,
          },
        });

      if (!course) {
        throw new AppError(
          404,
          "Course not found",
        );
      }

      if (!course.isActive) {
        throw new AppError(
          400,
          "This course is currently inactive",
        );
      }

      // --------------------------------------------------------
      // Check existing active enrollment
      // --------------------------------------------------------

      const existingEnrollment =
        await tx.enrollment.findFirst({
          where: {
            studentId: student.id,
            courseId: course.id,

            // Ignore soft-deleted enrollments
            deletedAt: null,
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

      // --------------------------------------------------------
      // Check course capacity
      // --------------------------------------------------------

      const enrolledCount =
        await tx.enrollment.count({
          where: {
            courseId: course.id,

            // Only active enrollments count
            deletedAt: null,

            status: EnrollmentStatus.APPROVED,
          },
        });

      if (enrolledCount >= course.capacity) {
        throw new AppError(
          409,
          "Course capacity is full",
        );
      }

      // --------------------------------------------------------
      // Create enrollment
      // --------------------------------------------------------

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
          error instanceof
            Prisma.PrismaClientKnownRequestError &&
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
      isolationLevel:
        Prisma.TransactionIsolationLevel.Serializable,
    },
  );
};

// ============================================================
// GET SINGLE ENROLLMENT
// ============================================================

const getEnrollmentById = async (
  id: string,
) => {
  const enrollment =
    await prisma.enrollment.findFirst({
      where: {
        id,

        // Enrollment must not be soft deleted
        deletedAt: null,

        // Student must not be soft deleted
        student: {
          deletedAt: null,

          user: {
            deletedAt: null,
          },

          department: {
            deletedAt: null,
          },
        },

        // Course must not be soft deleted
        course: {
          deletedAt: null,

          department: {
            deletedAt: null,
          },
        },
      },

      select: enrollmentPublicSelect,
    });

  if (!enrollment) {
    throw new AppError(
      404,
      "Enrollment not found",
    );
  }

  return enrollment;
};

// ============================================================
// GET MY ENROLLMENTS
// ============================================================

const getMyEnrollments = async (
  userId: string,
  query: EnrollmentQueryInput,
) => {
  const student =
    await getStudentProfile(userId);

  return getEnrollments({
    ...query,
    studentId: student.id,
  });
};

// ============================================================
// GET ALL ENROLLMENTS
// ============================================================

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
    // Exclude soft-deleted enrollments
    deletedAt: null,

    // Exclude enrollments belonging to deleted students
    student: {
      deletedAt: null,

      user: {
        deletedAt: null,
      },

      department: {
        deletedAt: null,
      },
    },

    // Exclude enrollments belonging to deleted courses
    course: {
      deletedAt: null,

      department: {
        deletedAt: null,
      },
    },

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

  const [total, enrollments] =
    await prisma.$transaction([
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
      totalPages: Math.ceil(
        total / limit,
      ),
    },

    data: enrollments,
  };
};

// ============================================================
// UPDATE ENROLLMENT STATUS
// ============================================================

const updateEnrollmentStatus = async (
  id: string,
  payload: UpdateEnrollmentStatusInput,
) => {
  const enrollment =
    await prisma.enrollment.findFirst({
      where: {
        id,

        // Cannot update a soft-deleted enrollment
        deletedAt: null,

        // Student must still be active
        student: {
          deletedAt: null,

          user: {
            deletedAt: null,
          },
        },

        // Course must still be active
        course: {
          deletedAt: null,
        },
      },

      select: {
        id: true,
        status: true,
      },
    });

  if (!enrollment) {
    throw new AppError(
      404,
      "Enrollment not found",
    );
  }

  if (
    enrollment.status !==
    EnrollmentStatus.PENDING
  ) {
    throw new AppError(
      400,
      "Only pending enrollments can be reviewed",
    );
  }

  const updatedEnrollment =
    await prisma.enrollment.update({
      where: {
        id,
      },

      data: {
        status:
          payload.status as EnrollmentStatus,
      },

      select: enrollmentPublicSelect,
    });

  return updatedEnrollment;
};

// ============================================================
// CANCEL MY ENROLLMENT
// ============================================================

const cancelMyEnrollment = async (
  userId: string,
  id: string,
) => {
  const student =
    await getStudentProfile(userId);

  const enrollment =
    await prisma.enrollment.findFirst({
      where: {
        id,

        studentId: student.id,

        // Cannot cancel soft-deleted enrollment
        deletedAt: null,

        // Course must still exist
        course: {
          deletedAt: null,
        },
      },

      select: {
        id: true,
        status: true,
      },
    });

  if (!enrollment) {
    throw new AppError(
      404,
      "Enrollment not found",
    );
  }

  if (
    enrollment.status !==
    EnrollmentStatus.PENDING
  ) {
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

// ============================================================
// EXPORT
// ============================================================

export const enrollmentService = {
  createEnrollment,
  getEnrollmentById,
  getMyEnrollments,
  getEnrollments,
  updateEnrollmentStatus,
  cancelMyEnrollment,
};