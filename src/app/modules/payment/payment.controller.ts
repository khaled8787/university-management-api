import type { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

import sendResponse from "../../utils/sendResponse.js";
import catchAsync from "../../middlewares/catchAsync.js";
import AppError from "../../errors/AppError.js";

import {
  createPaymentSchema,
  paymentIdParamSchema,
  paymentQuerySchema,
} from "./payment.validation.js";

import {
  cancelPayment,
  createPayment,
  getAllPayments,
  getMyPayments,
  getPaymentById,
  getPaymentByIdForAdmin,
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