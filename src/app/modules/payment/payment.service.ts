import {
  PaymentMethod,
  PaymentStatus,
  PaymentType,
  Prisma,
} from "@prisma/client";

import prisma from "../../../config/prisma.js";
import AppError from "../../errors/AppError.js";

import type {
  CreatePaymentInput,
  PaymentQueryInput,
} from "./payment.validation.js";

const paymentSelect = {
  id: true,
  studentId: true,
  amount: true,
  currency: true,
  type: true,
  method: true,
  status: true,
  transactionId: true,
  providerSessionId: true,
  paidAt: true,
  failureReason: true,
  metadata: true,
  createdAt: true,
  updatedAt: true,

  student: {
    select: {
      id: true,
      studentId: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  },
} satisfies Prisma.PaymentSelect;

const generateTransactionId = (): string => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const randomValue = Math.random().toString(36).substring(2, 10).toUpperCase();

  return `PAY-${timestamp}-${randomValue}`;
};

const getStudentProfile = async (userId: string) => {
  const student = await prisma.student.findUnique({
    where: {
      userId,
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

export const createPayment = async (
  userId: string,
  payload: CreatePaymentInput,
) => {
  const student = await getStudentProfile(userId);

  const existingPendingPayment = await prisma.payment.findFirst({
    where: {
      studentId: student.id,
      amount: new Prisma.Decimal(payload.amount),
      type: payload.type as PaymentType,
      method: payload.method as PaymentMethod,
      status: PaymentStatus.PENDING,
    },
    select: {
      id: true,
      transactionId: true,
      status: true,
      amount: true,
      currency: true,
      type: true,
      method: true,
    },
  });

  if (existingPendingPayment) {
    throw new AppError(
      409,
      "A similar pending payment already exists",
      [existingPendingPayment],
    );
  }

  const transactionId = generateTransactionId();

  const payment = await prisma.payment.create({
    data: {
      studentId: student.id,
      amount: new Prisma.Decimal(payload.amount),
      currency: payload.currency,
      type: payload.type as PaymentType,
      method: payload.method as PaymentMethod,
      status: PaymentStatus.PENDING,
      transactionId,
      metadata: {
        gatewayInitialized: false,
        createdBy: userId,
      },
    },
    select: paymentSelect,
  });

  return {
    payment,
    gateway: {
      method: payload.method,
      status: "NOT_INITIALIZED",
      message:
        "Payment created successfully. Gateway initialization is required before checkout.",
    },
  };
};

export const getMyPayments = async (
  userId: string,
  query: PaymentQueryInput,
) => {
  const student = await getStudentProfile(userId);

  const { page, limit, status, type, method, sortBy, sortOrder } = query;

  const where: Prisma.PaymentWhereInput = {
    studentId: student.id,
    ...(status && { status: status as PaymentStatus }),
    ...(type && { type: type as PaymentType }),
    ...(method && { method: method as PaymentMethod }),
  };

  const skip = (page - 1) * limit;

  const [payments, total] = await prisma.$transaction([
    prisma.payment.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        [sortBy]: sortOrder,
      },
      select: paymentSelect,
    }),
    prisma.payment.count({ where }),
  ]);

  return {
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    data: payments,
  };
};

export const getAllPayments = async (query: PaymentQueryInput) => {
  const { page, limit, status, type, method, studentId, sortBy, sortOrder } =
    query;

  const where: Prisma.PaymentWhereInput = {
    ...(status && { status: status as PaymentStatus }),
    ...(type && { type: type as PaymentType }),
    ...(method && { method: method as PaymentMethod }),
    ...(studentId && { studentId }),
  };

  const skip = (page - 1) * limit;

  const [payments, total] = await prisma.$transaction([
    prisma.payment.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        [sortBy]: sortOrder,
      },
      select: paymentSelect,
    }),
    prisma.payment.count({ where }),
  ]);

  return {
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    data: payments,
  };
};

export const getPaymentById = async (paymentId: string, userId: string) => {
  const payment = await prisma.payment.findUnique({
    where: {
      id: paymentId,
    },
    select: paymentSelect,
  });

  if (!payment) {
    throw new AppError(404, "Payment not found");
  }

  if (payment.student.user.id !== userId) {
    throw new AppError(403, "You are not allowed to access this payment");
  }

  return payment;
};

export const getPaymentByIdForAdmin = async (paymentId: string) => {
  const payment = await prisma.payment.findUnique({
    where: {
      id: paymentId,
    },
    select: paymentSelect,
  });

  if (!payment) {
    throw new AppError(404, "Payment not found");
  }

  return payment;
};

/**
 * This function is intentionally not exposed through an API route.
 * Only a verified payment gateway webhook/callback should call it.
 */
export const markPaymentAsPaid = async (
  paymentId: string,
  providerTransactionId: string,
  providerSessionId?: string,
) => {
  return prisma.$transaction(async (transaction) => {
    const payment = await transaction.payment.findUnique({
      where: {
        id: paymentId,
      },
    });

    if (!payment) {
      throw new AppError(404, "Payment not found");
    }

    if (payment.status === PaymentStatus.PAID) {
      return payment;
    }

    if (payment.status !== PaymentStatus.PENDING) {
      throw new AppError(
        409,
        `Payment cannot be completed from ${payment.status} status`,
      );
    }

    const duplicateTransaction = await transaction.payment.findFirst({
      where: {
        transactionId: providerTransactionId,
        NOT: {
          id: paymentId,
        },
      },
    });

    if (duplicateTransaction) {
      throw new AppError(409, "This provider transaction is already used");
    }

    return transaction.payment.update({
      where: {
        id: paymentId,
      },
      data: {
        status: PaymentStatus.PAID,
        transactionId: providerTransactionId,
        providerSessionId,
        paidAt: new Date(),
        failureReason: null,
      },
      select: paymentSelect,
    });
  });
};

export const cancelPayment = async (paymentId: string, userId: string) => {
  const student = await getStudentProfile(userId);

  const payment = await prisma.payment.findFirst({
    where: {
      id: paymentId,
      studentId: student.id,
    },
  });

  if (!payment) {
    throw new AppError(404, "Payment not found");
  }

  if (payment.status !== PaymentStatus.PENDING) {
    throw new AppError(
      409,
      "Only pending payments can be cancelled",
    );
  }

  return prisma.payment.update({
    where: {
      id: paymentId,
    },
    data: {
      status: PaymentStatus.CANCELLED,
    },
    select: paymentSelect,
  });
};