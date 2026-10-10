import {
  EnrollmentStatus,
  PaymentMethod,
  PaymentStatus,
  PaymentType,
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
      fee: true,
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

// Used only when creating an enrollment.
// Returns the payment ID needed to start Stripe Checkout.
const enrollmentWithPaymentSelect = {
  ...enrollmentPublicSelect,
  payments: {
    where: {
      status: PaymentStatus.PENDING,
      type: PaymentType.COURSE_FEE,
      method: PaymentMethod.STRIPE,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 1,
    select: {
      id: true,
      amount: true,
      currency: true,
      type: true,
      method: true,
      status: true,
      createdAt: true,
    },
  },
} satisfies Prisma.EnrollmentSelect;

// ============================================================
// GET STUDENT PROFILE
// ============================================================

const getStudentProfile = async (userId: string) => {
  const student = await prisma.student.findFirst({
    where: {
      userId,
      deletedAt: null,
      user: {
        deletedAt: null,
        status: "ACTIVE",
      },
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
    throw new AppError(404, "Student profile not found");
  }

  return student;
};

// ============================================================
// CREATE ENROLLMENT AND PAYMENT
// ============================================================

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
          department: {
            deletedAt: null,
          },
        },
        select: {
          id: true,
          isActive: true,
          capacity: true,
          fee: true,
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

      if (course.fee.lessThanOrEqualTo(0)) {
        throw new AppError(
          400,
          "This course does not have a valid fee configured",
        );
      }

      const existingEnrollment = await tx.enrollment.findFirst({
        where: {
          studentId: student.id,
          courseId: course.id,
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

      // Reserve capacity for pending and approved enrollments.
      const enrolledCount = await tx.enrollment.count({
        where: {
          courseId: course.id,
          deletedAt: null,
          status: {
            in: [
              EnrollmentStatus.PENDING,
              EnrollmentStatus.APPROVED,
            ],
          },
        },
      });

      if (enrolledCount >= course.capacity) {
        throw new AppError(409, "Course capacity is full");
      }

      try {
        const enrollment = await tx.enrollment.create({
          data: {
            studentId: student.id,
            courseId: course.id,
            status: EnrollmentStatus.PENDING,
          },
          select: {
            id: true,
            studentId: true,
            courseId: true,
            status: true,
            enrolledAt: true,
            completedAt: true,
            createdAt: true,
            updatedAt: true,
          },
        });

        // Never accept the payment amount from the client.
        // The amount comes from the database Course.fee field.
        const payment = await tx.payment.create({
          data: {
            studentId: student.id,
            enrollmentId: enrollment.id,
            amount: course.fee,
            currency: "BDT",
            type: PaymentType.COURSE_FEE,
            method: PaymentMethod.STRIPE,
            status: PaymentStatus.PENDING,
          },
          select: {
            id: true,
            amount: true,
            currency: true,
            type: true,
            method: true,
            status: true,
            createdAt: true,
          },
        });

        const enrollmentDetails = await tx.enrollment.findUniqueOrThrow({
          where: {
            id: enrollment.id,
          },
          select: enrollmentPublicSelect,
        });

        return {
          ...enrollmentDetails,
          payment,
        };
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
      isolationLevel:
        Prisma.TransactionIsolationLevel.Serializable,
    },
  );
};

// ============================================================
// GET SINGLE ENROLLMENT
// ============================================================

const getEnrollmentById = async (id: string) => {
  const enrollment = await prisma.enrollment.findFirst({
    where: {
      id,
      deletedAt: null,
      student: {
        deletedAt: null,
        user: {
          deletedAt: null,
        },
        department: {
          deletedAt: null,
        },
      },
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
    throw new AppError(404, "Enrollment not found");
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
  const student = await getStudentProfile(userId);

  return getEnrollments({
    ...query,
    studentId: student.id,
  });
};

// ============================================================
// GET ALL ENROLLMENTS
// ============================================================

const getEnrollments = async (query: EnrollmentQueryInput) => {
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
    deletedAt: null,
    student: {
      deletedAt: null,
      user: {
        deletedAt: null,
      },
      department: {
        deletedAt: null,
      },
    },
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

// ============================================================
// UPDATE ENROLLMENT STATUS
// ============================================================

const updateEnrollmentStatus = async (
  id: string,
  payload: UpdateEnrollmentStatusInput,
) => {
  const targetStatus = payload.status as EnrollmentStatus;

  return prisma.$transaction(async (tx) => {
    const enrollment = await tx.enrollment.findFirst({
      where: {
        id,
        deletedAt: null,
        student: {
          deletedAt: null,
          user: {
            deletedAt: null,
          },
        },
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
      throw new AppError(404, "Enrollment not found");
    }

    if (enrollment.status !== EnrollmentStatus.PENDING) {
      throw new AppError(
        400,
        "Only pending enrollments can be reviewed",
      );
    }

    // Enrollment approval must follow a successful payment.
    // The Stripe webhook will also approve the enrollment
    // after verifying the payment with the provider.
    if (targetStatus === EnrollmentStatus.APPROVED) {
      const paidPayment = await tx.payment.findFirst({
        where: {
          enrollmentId: id,
          status: PaymentStatus.PAID,
          type: PaymentType.COURSE_FEE,
        },
        select: {
          id: true,
        },
      });

      if (!paidPayment) {
        throw new AppError(
          400,
          "Enrollment cannot be approved before course fee payment is completed",
        );
      }
    }

    return tx.enrollment.update({
      where: {
        id,
      },
      data: {
        status: targetStatus,
      },
      select: enrollmentPublicSelect,
    });
  });
};

// ============================================================
// CANCEL MY ENROLLMENT
// ============================================================

const cancelMyEnrollment = async (
  userId: string,
  id: string,
) => {
  const student = await getStudentProfile(userId);

  return prisma.$transaction(async (tx) => {
    const enrollment = await tx.enrollment.findFirst({
      where: {
        id,
        studentId: student.id,
        deletedAt: null,
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
      throw new AppError(404, "Enrollment not found");
    }

    if (enrollment.status !== EnrollmentStatus.PENDING) {
      throw new AppError(
        400,
        "Only pending enrollments can be cancelled",
      );
    }

    // Cancel outstanding payments so they cannot be used
    // to approve a cancelled enrollment later.
    await tx.payment.updateMany({
      where: {
        enrollmentId: enrollment.id,
        status: PaymentStatus.PENDING,
      },
      data: {
        status: PaymentStatus.CANCELLED,
        failureReason: "Enrollment cancelled by student",
      },
    });

    await tx.enrollment.update({
      where: {
        id: enrollment.id,
      },
      data: {
        status: EnrollmentStatus.DROPPED,
      },
    });

    return null;
  });
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
