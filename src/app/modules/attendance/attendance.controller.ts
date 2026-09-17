import type { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import sendResponse from "../../utils/sendResponse.js";
import { attendanceService } from "./attendance.service.js";
import {
  attendanceIdSchema,
  attendanceQuerySchema,
  createAttendanceSchema,
  updateAttendanceSchema,
} from "./attendance.validation.js";

export const createAttendance = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<Response | void> => {
  try {
    const payload = createAttendanceSchema.parse(req.body);

    const result = await attendanceService.createAttendance(
      req.user!.userId,
      req.user!.role,
      payload,
    );

    return sendResponse(res, {
      statusCode: StatusCodes.CREATED,
      success: true,
      message: "Attendance created successfully",
      data: result,
    });
  } catch (error) {
    return next(error);
  }
};

export const getAttendances = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<Response | void> => {
  try {
    const query = attendanceQuerySchema.parse(req.query);
    const result = await attendanceService.getAttendances(query);

    return sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Attendances retrieved successfully",
      data: result,
    });
  } catch (error) {
    return next(error);
  }
};

export const getMyAttendances = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<Response | void> => {
  try {
    const query = attendanceQuerySchema.parse(req.query);

    const result = await attendanceService.getMyAttendances(
      req.user!.userId,
      query,
    );

    return sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Your attendances retrieved successfully",
      data: result,
    });
  } catch (error) {
    return next(error);
  }
};

export const getAttendanceById = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<Response | void> => {
  try {
    const { id } = attendanceIdSchema.parse(req.params);
    const result = await attendanceService.getAttendanceById(id);

    return sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Attendance retrieved successfully",
      data: result,
    });
  } catch (error) {
    return next(error);
  }
};

export const updateAttendance = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<Response | void> => {
  try {
    const { id } = attendanceIdSchema.parse(req.params);
    const payload = updateAttendanceSchema.parse(req.body);

    const result = await attendanceService.updateAttendance(
      req.user!.userId,
      req.user!.role,
      id,
      payload,
    );

    return sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Attendance updated successfully",
      data: result,
    });
  } catch (error) {
    return next(error);
  }
};

export const deleteAttendance = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<Response | void> => {
  try {
    const { id } = attendanceIdSchema.parse(req.params);

    await attendanceService.deleteAttendance(
      req.user!.userId,
      req.user!.role,
      id,
    );

    return sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Attendance deleted successfully",
      data: null,
    });
  } catch (error) {
    return next(error);
  }
};