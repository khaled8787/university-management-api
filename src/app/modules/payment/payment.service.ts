import {
  PaymentMethod,
  PaymentStatus,
  PaymentType,
  Prisma,
} from "@prisma/client";

import prisma from "../../../config/prisma.js";
import AppError from "../../errors/AppError.js";
import stripe from "../../../config/stripe.js";
import config from "../../../config/index.js";

import type {
  CreatePaymentInput,
  PaymentQueryInput,
} from "./payment.validation.js";
import type Stripe from "stripe";

interface StripeCheckoutResult {
  payment: Prisma.PaymentGetPayload<{
    select: typeof paymentSelect;
  }>;
  checkout: {
    sessionId: string;
    checkoutUrl: string | null;
    status: string | null;
  };
}


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

export const createStripeCheckoutSession = async (
  paymentId: string,
  userId: string,
): Promise<StripeCheckoutResult> => {
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
      `Checkout is not available for ${payment.status} payment`,
    );
  }

  if (payment.method !== PaymentMethod.STRIPE) {
    throw new AppError(
      400,
      "This payment is not configured for Stripe",
    );
  }

  // Reuse an existing open Stripe checkout session
  if (payment.providerSessionId) {
    const existingSession = await stripe.checkout.sessions.retrieve(
      payment.providerSessionId,
    );

    if (existingSession.status === "open" && existingSession.url) {
      return {
        payment: await prisma.payment.findUniqueOrThrow({
          where: {
            id: payment.id,
          },
          select: paymentSelect,
        }),
        checkout: {
          sessionId: existingSession.id,
          checkoutUrl: existingSession.url,
          status: existingSession.status ?? null,
        },
      };
    }
  }

  const amount = Number(payment.amount);

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new AppError(400, "Invalid payment amount");
  }

  const frontendUrl =
    config.nodeEnv === "production"
      ? process.env.FRONTEND_URL
      : process.env.FRONTEND_URL || "http://localhost:3000";

  if (!frontendUrl) {
    throw new AppError(500, "Frontend URL is not configured");
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],

    line_items: [
      {
        price_data: {
          currency: config.stripe.currency,
          product_data: {
            name: `University Payment - ${payment.type}`,
            description: `Payment reference: ${payment.transactionId}`,
          },
          unit_amount: Math.round(amount * 100),
        },
        quantity: 1,
      },
    ],

    metadata: {
      paymentId: payment.id,
      studentId: student.id,
      transactionId: payment.transactionId,
    },

    success_url: `${frontendUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${frontendUrl}/payment/cancelled?payment_id=${payment.id}`,
  });

  if (!session.id) {
    throw new AppError(
      500,
      "Stripe checkout session could not be created",
    );
  }

  const updatedPayment = await prisma.payment.update({
    where: {
      id: payment.id,
    },
    data: {
      providerSessionId: session.id,
      metadata: {
        gatewayInitialized: true,
        gateway: "STRIPE",
        checkoutSessionCreatedAt: new Date().toISOString(),
        createdBy: userId,
      },
    },
    select: paymentSelect,
  });

  return {
    payment: updatedPayment,
    checkout: {
      sessionId: session.id,
      checkoutUrl: session.url ?? null,
      status: session.status ?? null,
    },
  };
};


export const handleStripeWebhookEvent = async (
  event: Stripe.Event,
): Promise<void> => {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;

      const paymentId = session.metadata?.paymentId;
      const transactionId = session.payment_intent
        ? String(session.payment_intent)
        : undefined;

      if (!paymentId) {
        throw new AppError(
          400,
          "Payment ID is missing from Stripe session metadata",
        );
      }

      if (session.payment_status !== "paid") {
        return;
      }

      if (!transactionId) {
        throw new AppError(
          400,
          "Stripe transaction ID is missing",
        );
      }

      await markPaymentAsPaid(
        paymentId,
        transactionId,
        session.id,
      );

      return;
    }

    case "checkout.session.async_payment_succeeded": {
      const session = event.data.object as Stripe.Checkout.Session;

      const paymentId = session.metadata?.paymentId;
      const transactionId = session.payment_intent
        ? String(session.payment_intent)
        : undefined;

      if (!paymentId || !transactionId) {
        throw new AppError(
          400,
          "Payment metadata is incomplete",
        );
      }

      await markPaymentAsPaid(
        paymentId,
        transactionId,
        session.id,
      );

      return;
    }

    case "checkout.session.async_payment_failed": {
      const session = event.data.object as Stripe.Checkout.Session;

      const paymentId = session.metadata?.paymentId;

      if (!paymentId) {
        return;
      }

      await prisma.payment.updateMany({
        where: {
          id: paymentId,
          status: PaymentStatus.PENDING,
        },
        data: {
          status: PaymentStatus.FAILED,
          failureReason: "Stripe payment failed",
          metadata: {
            gateway: "STRIPE",
            eventType: event.type,
            eventId: event.id,
            failedAt: new Date().toISOString(),
          },
        },
      });

      return;
    }

    case "checkout.session.expired": {
      const session = event.data.object as Stripe.Checkout.Session;

      const paymentId = session.metadata?.paymentId;

      if (!paymentId) {
        return;
      }

      await prisma.payment.updateMany({
        where: {
          id: paymentId,
          status: PaymentStatus.PENDING,
        },
        data: {
          status: PaymentStatus.CANCELLED,
          failureReason: "Stripe checkout session expired",
          metadata: {
            gateway: "STRIPE",
            eventType: event.type,
            eventId: event.id,
            expiredAt: new Date().toISOString(),
          },
        },
      });

      return;
    }

    default:
      // Unhandled Stripe events are safely ignored
      return;
  }
};