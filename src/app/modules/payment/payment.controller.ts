import type { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import stripe from "../../../config/stripe.js";
import config from "../../../config/index.js";
import sendResponse from "../../utils/sendResponse.js";
import catchAsync from "../../middlewares/catchAsync.js";
import AppError from "../../errors/AppError.js";
import type Stripe from "stripe";
import {
  createPaymentSchema,
  paymentIdParamSchema,
  paymentQuerySchema,
} from "./payment.validation.js";

import {
  cancelPayment,
  createPayment,
  createStripeCheckoutSession,
  getAllPayments,
  getMyPayments,
  getPaymentById,
  getPaymentByIdForAdmin,
  handleStripeWebhookEvent,
} from "./payment.service.js";

export const createPaymentController = catchAsync(
  async (req: Request, res: Response) => {
    if (!req.user?.userId) {
      throw new AppError(401, "Unauthorized user");
    }

    const payload = createPaymentSchema.parse(req.body);

    const result = await createPayment(req.user.userId, payload);

    sendResponse(res, {
      statusCode: StatusCodes.CREATED,
      success: true,
      message: "Payment created successfully",
      data: result,
    });
  },
);

export const getMyPaymentsController = catchAsync(
  async (req: Request, res: Response) => {
    if (!req.user?.userId) {
      throw new AppError(401, "Unauthorized user");
    }

    const query = paymentQuerySchema.parse(req.query);

    const result = await getMyPayments(req.user.userId, query);

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Your payments retrieved successfully",
      data: result,
    });
  },
);

export const getAllPaymentsController = catchAsync(
  async (req: Request, res: Response) => {
    const query = paymentQuerySchema.parse(req.query);

    const result = await getAllPayments(query);

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Payments retrieved successfully",
      data: result,
    });
  },
);

export const getMyPaymentByIdController = catchAsync(
  async (req: Request, res: Response) => {
    if (!req.user?.userId) {
      throw new AppError(401, "Unauthorized user");
    }

    const { id } = paymentIdParamSchema.parse(req.params);

    const result = await getPaymentById(id, req.user.userId);

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Payment retrieved successfully",
      data: result,
    });
  },
);

export const getAdminPaymentByIdController = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = paymentIdParamSchema.parse(req.params);

    const result = await getPaymentByIdForAdmin(id);

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Payment retrieved successfully",
      data: result,
    });
  },
);

export const cancelPaymentController = catchAsync(
  async (req: Request, res: Response) => {
    if (!req.user?.userId) {
      throw new AppError(401, "Unauthorized user");
    }

    const { id } = paymentIdParamSchema.parse(req.params);

    const result = await cancelPayment(id, req.user.userId);

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Payment cancelled successfully",
      data: result,
    });
  },
);

export const createStripeCheckoutController = catchAsync(
  async (req: Request, res: Response) => {
    if (!req.user?.userId) {
      throw new AppError(401, "Unauthorized user");
    }

    const { id } = paymentIdParamSchema.parse(req.params);

    const result = await createStripeCheckoutSession(
      id,
      req.user.userId,
    );

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Stripe checkout session created successfully",
      data: result,
    });
  },
);

export const stripeWebhookController = catchAsync(
  async (req: Request, res: Response) => {
    const signature = req.headers["stripe-signature"];

    if (!signature || Array.isArray(signature)) {
      throw new AppError(
        400,
        "Missing or invalid Stripe signature",
      );
    }

    if (!config.stripe.webhookSecret) {
      throw new AppError(
        500,
        "Stripe webhook secret is not configured",
      );
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        signature,
        config.stripe.webhookSecret,
      );
    } catch {
      throw new AppError(
        400,
        "Invalid Stripe webhook signature",
      );
    }

    await handleStripeWebhookEvent(event);

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Stripe webhook processed successfully",
      data: {
        received: true,
      },
    });
  },
);