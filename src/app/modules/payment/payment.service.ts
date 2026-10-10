import {
  AuditAction,
  EnrollmentStatus,
  PaymentMethod,
  PaymentStatus,
  PaymentType,
  Prisma,
} from "@prisma/client";

import type Stripe from "stripe";

import prisma from "../../../config/prisma.js";
import stripe from "../../../config/stripe.js";
import config from "../../../config/index.js";

import AppError from "../../errors/AppError.js";
import { logActivity } from "../../utils/auditLog.js";

import type {
  CreatePaymentInput,
  PaymentQueryInput,
} from "./payment.validation.js";

const paymentSelect = {
  id: true,
  studentId: true,
  enrollmentId: true,
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

  enrollment: {
    select: {
      id: true,
      status: true,
      studentId: true,
      courseId: true,
    },
  },
} satisfies Prisma.PaymentSelect;

type SelectedPayment = Prisma.PaymentGetPayload<{
  select: typeof paymentSelect;
}>;

interface StripeCheckoutResult {
  payment: SelectedPayment;
  checkout: {
    sessionId: string;
    checkoutUrl: string | null;
    status: string | null;
  };
}

const generateTransactionId = (): string => {
  const timestamp = Date.now().toString(36).toUpperCase();

  const randomValue = Math.random()
    .toString(36)
    .substring(2, 10)
    .toUpperCase();

  return `PAY-${timestamp}-${randomValue}`;
};

const getStudentProfile = async (userId: string) => {
  const student = await prisma.student.findUnique({
    where: { userId },
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

const getFrontendUrl = (): string => {
  const frontendUrl =
    process.env.FRONTEND_URL ||
    (config.nodeEnv === "production"
      ? ""
      : "http://localhost:3000");

  if (!frontendUrl) {
    throw new AppError(500, "Frontend URL is not configured");
  }

  return frontendUrl.replace(/\/+$/, "");
};

/**
 * Creates a general payment record.
 *
 * Course-fee payments must be created through the enrollment flow,
 * which links the payment to its enrollment and uses the server-side fee.
 */
export const createPayment = async (
  userId: string,
  payload: CreatePaymentInput,
) => {
  const student = await getStudentProfile(userId);

  if (payload.type === PaymentType.COURSE_FEE) {
    throw new AppError(
      400,
      "Course-fee payments must be created through course enrollment",
    );
  }

  if (payload.method !== PaymentMethod.STRIPE) {
    throw new AppError(
      400,
      "Only Stripe payments are supported by this checkout flow",
    );
  }

  const amount = new Prisma.Decimal(payload.amount);

  if (!amount.isFinite() || amount.lte(0)) {
    throw new AppError(400, "Payment amount must be greater than zero");
  }

  const existingPendingPayment = await prisma.payment.findFirst({
    where: {
      studentId: student.id,
      amount,
      type: payload.type as PaymentType,
      method: payload.method as PaymentMethod,
      status: PaymentStatus.PENDING,
      enrollmentId: null,
    },
    select: { id: true },
  });

  if (existingPendingPayment) {
    throw new AppError(409, "A similar pending payment already exists");
  }

  const transactionId = generateTransactionId();

  const payment = await prisma.payment.create({
    data: {
      studentId: student.id,
      amount,
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

  await logActivity({
    actorId: userId,
    action: AuditAction.PAYMENT,
    entity: "Payment",
    entityId: payment.id,
    description: "New payment created",
    newData: {
      amount: payment.amount.toString(),
      currency: payment.currency,
      type: payment.type,
      method: payment.method,
      status: payment.status,
      transactionId: payment.transactionId,
      studentId: payment.studentId,
    },
  });

  return {
    payment,
    gateway: {
      method: payment.method,
      status: "NOT_INITIALIZED",
      message: "Payment created successfully. Initialize Stripe checkout to continue.",
    },
  };
};

export const getMyPayments = async (
  userId: string,
  query: PaymentQueryInput,
) => {
  const student = await getStudentProfile(userId);

  const {
    page,
    limit,
    status,
    type,
    method,
    sortBy,
    sortOrder,
  } = query;

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
      orderBy: { [sortBy]: sortOrder },
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

export const getAllPayments = async (
  query: PaymentQueryInput,
) => {
  const {
    page,
    limit,
    status,
    type,
    method,
    studentId,
    sortBy,
    sortOrder,
  } = query;

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
      orderBy: { [sortBy]: sortOrder },
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

export const getPaymentById = async (
  paymentId: string,
  userId: string,
) => {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    select: paymentSelect,
  });

  if (!payment) {
    throw new AppError(404, "Payment not found");
  }

  if (payment.student.user.id !== userId) {
    throw new AppError(
      403,
      "You are not allowed to access this payment",
    );
  }

  return payment;
};

export const getPaymentByIdForAdmin = async (
  paymentId: string,
) => {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    select: paymentSelect,
  });

  if (!payment) {
    throw new AppError(404, "Payment not found");
  }

  return payment;
};

/**
 * Call only after verifying the Stripe webhook signature and payment details.
 *
 * The payment status update and enrollment approval happen in one transaction.
 * Already-paid payments are idempotent and do not generate another audit entry.
 */
export const markPaymentAsPaid = async (
  paymentId: string,
  providerTransactionId: string,
  providerSessionId?: string,
) => {
  if (!providerTransactionId) {
    throw new AppError(400, "Stripe transaction ID is required");
  }

  const result = await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({
      where: { id: paymentId },
      select: paymentSelect,
    });

    if (!payment) {
      throw new AppError(404, "Payment not found");
    }

    if (payment.status === PaymentStatus.PAID) {
      // Do not process the same successful payment twice.
      if (
        providerSessionId &&
        payment.providerSessionId &&
        payment.providerSessionId !== providerSessionId
      ) {
        throw new AppError(409, "Stripe session does not match this payment");
      }

      return {
        payment,
        enrollmentApproved: false,
        alreadyPaid: true,
      };
    }

    if (payment.status !== PaymentStatus.PENDING) {
      throw new AppError(
        409,
        `Payment cannot be completed from ${payment.status} status`,
      );
    }

    if (
      providerSessionId &&
      payment.providerSessionId &&
      payment.providerSessionId !== providerSessionId
    ) {
      throw new AppError(409, "Stripe session does not match this payment");
    }

    const duplicateTransaction = await tx.payment.findFirst({
      where: {
        transactionId: providerTransactionId,
        NOT: { id: paymentId },
      },
      select: { id: true },
    });

    if (duplicateTransaction) {
      throw new AppError(
        409,
        "This provider transaction is already used",
      );
    }

    let enrollmentApproved = false;

    if (payment.enrollmentId) {
      const enrollment = await tx.enrollment.findUnique({
        where: { id: payment.enrollmentId },
        select: {
          id: true,
          studentId: true,
          status: true,
        },
      });

      if (!enrollment) {
        throw new AppError(409, "Linked enrollment was not found");
      }

      if (enrollment.studentId !== payment.studentId) {
        throw new AppError(
          409,
          "Payment student does not match the linked enrollment",
        );
      }

      // A successful charge for a cancelled/rejected enrollment must not
      // automatically reactivate that enrollment.
      enrollmentApproved =
        enrollment.status === EnrollmentStatus.PENDING;
    }

    const updatedPayment = await tx.payment.update({
      where: { id: paymentId },
      data: {
        status: PaymentStatus.PAID,
        transactionId: providerTransactionId,
        ...(providerSessionId && {
          providerSessionId,
        }),
        paidAt: new Date(),
        failureReason: null,
      },
      select: paymentSelect,
    });

    if (payment.enrollmentId && enrollmentApproved) {
      await tx.enrollment.update({
        where: {
          id: payment.enrollmentId,
          status: EnrollmentStatus.PENDING,
        },
        data: {
          status: EnrollmentStatus.APPROVED,
        },
      });
    }

    return {
      payment: updatedPayment,
      enrollmentApproved,
      alreadyPaid: false,
    };
  });

  if (result.alreadyPaid) {
    return result.payment;
  }

  await logActivity({
    actorId: result.payment.student.user.id,
    action: AuditAction.PAYMENT,
    entity: "Payment",
    entityId: result.payment.id,
    description: "Payment successfully completed through Stripe",
    oldData: {
      status: PaymentStatus.PENDING,
    },
    newData: {
      status: result.payment.status,
      transactionId: result.payment.transactionId,
      providerSessionId: result.payment.providerSessionId,
      paidAt: result.payment.paidAt?.toISOString() ?? null,
      enrollmentId: result.payment.enrollmentId,
      enrollmentApproved: result.enrollmentApproved,
    },
  });

  return result.payment;
};

export const cancelPayment = async (
  paymentId: string,
  userId: string,
) => {
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

  const result = await prisma.payment.updateMany({
    where: {
      id: paymentId,
      studentId: student.id,
      status: PaymentStatus.PENDING,
    },
    data: {
      status: PaymentStatus.CANCELLED,
      failureReason: "Cancelled by student",
    },
  });

  if (result.count === 0) {
    throw new AppError(
      409,
      "Payment status changed; refresh and try again",
    );
  }

  const updatedPayment = await prisma.payment.findUniqueOrThrow({
    where: { id: paymentId },
    select: paymentSelect,
  });

  await logActivity({
    actorId: userId,
    action: AuditAction.PAYMENT,
    entity: "Payment",
    entityId: paymentId,
    description: "Payment cancelled by student",
    oldData: {
      status: payment.status,
      transactionId: payment.transactionId,
    },
    newData: {
      status: updatedPayment.status,
    },
  });

  return updatedPayment;
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
    select: paymentSelect,
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

  if (
    payment.type === PaymentType.COURSE_FEE &&
    !payment.enrollmentId
  ) {
    throw new AppError(
      409,
      "Course-fee payment must be linked to an enrollment",
    );
  }

  if (payment.providerSessionId) {
    try {
      const existingSession =
        await stripe.checkout.sessions.retrieve(
          payment.providerSessionId,
        );

      if (
        existingSession.status === "open" &&
        existingSession.url
      ) {
        return {
          payment,
          checkout: {
            sessionId: existingSession.id,
            checkoutUrl: existingSession.url,
            status: existingSession.status,
          },
        };
      }

      if (
        existingSession.payment_status === "paid"
      ) {
        throw new AppError(
          409,
          "Stripe reports this session as paid; wait for webhook processing",
        );
      }
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      // If the old session cannot be retrieved, do not silently create
      // another session: the existing session may still be valid.
      throw new AppError(
        502,
        "Unable to verify the existing Stripe checkout session",
      );
    }
  }

  const amount = new Prisma.Decimal(payment.amount);

  if (!amount.isFinite() || amount.lte(0)) {
    throw new AppError(400, "Invalid payment amount");
  }

  const amountInMinorUnits = amount.mul(100);

  if (!amountInMinorUnits.isInteger()) {
    throw new AppError(
      400,
      "Payment amount cannot be represented in the configured currency",
    );
  }

  const frontendUrl = getFrontendUrl();

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],

    line_items: [
      {
        price_data: {
          currency: config.stripe.currency.toLowerCase(),
          product_data: {
            name: `University Payment - ${payment.type}`,
            description: `Payment reference: ${payment.transactionId}`,
          },
          unit_amount: amountInMinorUnits.toNumber(),
        },
        quantity: 1,
      },
    ],

    metadata: {
      paymentId: payment.id,
      studentId: student.id,
      transactionId: payment.transactionId,
      enrollmentId: payment.enrollmentId ?? "",
    },

    success_url:
      `${frontendUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,

    cancel_url:
      `${frontendUrl}/payment/cancelled?payment_id=${encodeURIComponent(payment.id)}`,
  });

  if (!session.id || !session.url) {
    throw new AppError(
      502,
      "Stripe checkout session could not be created",
    );
  }

  // Protect against overwriting a payment that changed while Stripe
  // was creating the session.
  const updateResult = await prisma.payment.updateMany({
    where: {
      id: payment.id,
      studentId: student.id,
      status: PaymentStatus.PENDING,
      providerSessionId: payment.providerSessionId,
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
  });

  if (updateResult.count === 0) {
    throw new AppError(
      409,
      "Payment changed while checkout was being initialized; refresh and retry",
    );
  }

  const updatedPayment = await prisma.payment.findUniqueOrThrow({
    where: { id: payment.id },
    select: paymentSelect,
  });

  await logActivity({
    actorId: userId,
    action: AuditAction.PAYMENT,
    entity: "Payment",
    entityId: payment.id,
    description: "Stripe checkout session created",
    newData: {
      gateway: "STRIPE",
      sessionId: session.id,
      status: session.status,
      paymentStatus: updatedPayment.status,
    },
  });

  return {
    payment: updatedPayment,
    checkout: {
      sessionId: session.id,
      checkoutUrl: session.url,
      status: session.status,
    },
  };
};

/**
 * This handler must only be called after Stripe's webhook signature
 * has been verified by the webhook route.
 */
export const handleStripeWebhookEvent = async (
  event: Stripe.Event,
): Promise<void> => {
  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded": {
      const session =
        event.data.object as Stripe.Checkout.Session;

      const paymentId = session.metadata?.paymentId;
      const metadataStudentId = session.metadata?.studentId;
      const metadataTransactionId = session.metadata?.transactionId;

      if (!paymentId || !metadataStudentId || !metadataTransactionId) {
        throw new AppError(
          400,
          "Stripe session metadata is incomplete",
        );
      }

      if (session.payment_status !== "paid") {
        return;
      }

      if (!session.payment_intent) {
        throw new AppError(
          400,
          "Stripe transaction ID is missing",
        );
      }

      const providerTransactionId =
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent.id;

      const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
        select: {
          id: true,
          studentId: true,
          enrollmentId: true,
          amount: true,
          currency: true,
          type: true,
          method: true,
          status: true,
          transactionId: true,
          providerSessionId: true,
        },
      });

      if (!payment) {
        throw new AppError(404, "Payment not found for Stripe session");
      }

      if (
        payment.studentId !== metadataStudentId ||
        payment.transactionId !== metadataTransactionId
      ) {
        throw new AppError(
          409,
          "Stripe session metadata does not match the payment",
        );
      }

      if (payment.method !== PaymentMethod.STRIPE) {
        throw new AppError(
          409,
          "Payment is not configured for Stripe",
        );
      }

      if (
        payment.providerSessionId &&
        payment.providerSessionId !== session.id
      ) {
        throw new AppError(
          409,
          "Stripe session does not match the payment record",
        );
      }

      if (
        session.currency &&
        session.currency.toLowerCase() !==
          payment.currency.toLowerCase()
      ) {
        throw new AppError(
          409,
          "Stripe currency does not match the payment currency",
        );
      }

      const expectedMinorUnits =
        new Prisma.Decimal(payment.amount).mul(100);

      if (
        session.amount_total === null ||
        !expectedMinorUnits.isInteger() ||
        expectedMinorUnits.toNumber() !== session.amount_total
      ) {
        throw new AppError(
          409,
          "Stripe amount does not match the payment amount",
        );
      }

      if (
        payment.type === PaymentType.COURSE_FEE &&
        (!payment.enrollmentId ||
          session.metadata?.enrollmentId !== payment.enrollmentId)
      ) {
        throw new AppError(
          409,
          "Stripe session does not match the linked enrollment",
        );
      }

      await markPaymentAsPaid(
        payment.id,
        providerTransactionId,
        session.id,
      );

      return;
    }

    case "checkout.session.async_payment_failed":
    case "checkout.session.expired": {
      const session =
        event.data.object as Stripe.Checkout.Session;

      const paymentId = session.metadata?.paymentId;

      if (!paymentId) {
        return;
      }

      const currentPayment = await prisma.payment.findUnique({
        where: { id: paymentId },
        select: {
          id: true,
          student: {
            select: {
              user: {
                select: { id: true },
              },
            },
          },
        },
      });

      if (!currentPayment) {
        return;
      }

      const isExpired =
        event.type === "checkout.session.expired";

      const nextStatus = isExpired
        ? PaymentStatus.CANCELLED
        : PaymentStatus.FAILED;

      const reason = isExpired
        ? "Stripe checkout session expired"
        : "Stripe payment failed";

      const updateResult = await prisma.payment.updateMany({
        where: {
          id: paymentId,
          status: PaymentStatus.PENDING,
          providerSessionId: session.id,
        },
        data: {
          status: nextStatus,
          failureReason: reason,
          metadata: {
            gateway: "STRIPE",
            eventType: event.type,
            eventId: event.id,
            processedAt: new Date().toISOString(),
          },
        },
      });

      if (updateResult.count > 0) {
        const updatedPayment = await prisma.payment.findUnique({
          where: { id: paymentId },
          select: paymentSelect,
        });

        if (updatedPayment) {
          await logActivity({
            actorId: currentPayment.student.user.id,
            action: AuditAction.PAYMENT,
            entity: "Payment",
            entityId: paymentId,
            description: reason,
            newData: {
              status: updatedPayment.status,
              failureReason: updatedPayment.failureReason,
              stripeEventId: event.id,
            },
          });
        }
      }

      return;
    }

    default:
      // Other Stripe events are intentionally ignored.
      return;
  }
};
