import type {
  NextFunction,
  Request,
  Response,
} from "express";

import { StatusCodes } from "http-status-codes";

import sendResponse from "../../utils/sendResponse.js";
import { enrollmentService } from "./enrollment.service.js";

import {
  createEnrollmentSchema,
  enrollmentIdParamSchema,
  enrollmentQuerySchema,
  updateEnrollmentStatusSchema,
} from "./enrollment.validation.js";

const createEnrollment = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<Response | void> => {
  try {
    if (!req.user?.userId) {
      return next(new Error("Authenticated user not found"));
    }

    const payload = createEnrollmentSchema.parse(req.body);

    const result = await enrollmentService.createEnrollment(
      req.user.userId,
      payload,
    );

    return sendResponse(res, {
      statusCode: StatusCodes.CREATED,
      success: true,
      message: "Enrollment request created successfully",
      data: result,
    });
  } catch (error) {
    return next(error);
  }
};

const getMyEnrollments = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<Response | void> => {
  try {
    if (!req.user?.userId) {
      return next(new Error("Authenticated user not found"));
    }

    const query = enrollmentQuerySchema.parse(req.query);

    const result = await enrollmentService.getMyEnrollments(
      req.user.userId,
      query,
    );

    return sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Your enrollments retrieved successfully",
      data: result,
    });
  } catch (error) {
    return next(error);
  }
};

const getEnrollments = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<Response | void> => {
  try {
    const query = enrollmentQuerySchema.parse(req.query);

    const result = await enrollmentService.getEnrollments(query);

    return sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Enrollments retrieved successfully",
      data: result,
    });
  } catch (error) {
    return next(error);
  }
};

const getEnrollmentById = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<Response | void> => {
  try {
    const { id } = enrollmentIdParamSchema.parse(req.params);

    const result = await enrollmentService.getEnrollmentById(id);

    return sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Enrollment retrieved successfully",
      data: result,
    });
  } catch (error) {
    return next(error);
  }
};

const updateEnrollmentStatus = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<Response | void> => {
  try {
    const { id } = enrollmentIdParamSchema.parse(req.params);

    const payload = updateEnrollmentStatusSchema.parse(req.body);

    const result = await enrollmentService.updateEnrollmentStatus(
      id,
      payload,
    );

    return sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Enrollment status updated successfully",
      data: result,
    });
  } catch (error) {
    return next(error);
  }
};

const cancelMyEnrollment = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<Response | void> => {
  try {
    if (!req.user?.userId) {
      return next(new Error("Authenticated user not found"));
    }

    const { id } = enrollmentIdParamSchema.parse(req.params);

    await enrollmentService.cancelMyEnrollment(
      req.user.userId,
      id,
    );

    return sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Enrollment cancelled successfully",
      data: null,
    });
  } catch (error) {
    return next(error);
  }
};

export const enrollmentController = {
  createEnrollment,
  getMyEnrollments,
  getEnrollments,
  getEnrollmentById,
  updateEnrollmentStatus,
  cancelMyEnrollment,
};