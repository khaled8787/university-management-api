import type { NextFunction, Request, Response } from "express";
import { AuditAction } from "@prisma/client";
import { StatusCodes } from "http-status-codes";

import sendResponse from "../../utils/sendResponse.js";
import { logActivity } from "../../utils/auditLog.js";
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

    await logActivity({
      req,
      actorId: req.user!.userId,
      action: AuditAction.CREATE,
      entity: "Attendance",
      entityId: result.id,
      description: "Attendance record created",
      newData: {
        studentId: result.studentId,
        courseId: result.courseId,
        facultyId: result.facultyId,
        date: result.date.toISOString(),
        status: result.status,
        remarks: result.remarks ?? null,
      },
    });

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

    // Capture the old record before updating it.
    const oldAttendance = await attendanceService.getAttendanceById(id);

    const result = await attendanceService.updateAttendance(
      req.user!.userId,
      req.user!.role,
      id,
      payload,
    );

    await logActivity({
      req,
      actorId: req.user!.userId,
      action: AuditAction.UPDATE,
      entity: "Attendance",
      entityId: result.id,
      description: "Attendance record updated",
      oldData: {
        studentId: oldAttendance.studentId,
        courseId: oldAttendance.courseId,
        facultyId: oldAttendance.facultyId,
        date: oldAttendance.date.toISOString(),
        status: oldAttendance.status,
        remarks: oldAttendance.remarks ?? null,
      },
      newData: {
        studentId: result.studentId,
        courseId: result.courseId,
        facultyId: result.facultyId,
        date: result.date.toISOString(),
        status: result.status,
        remarks: result.remarks ?? null,
      },
    });

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

    // Capture the old record before deletion.
    const oldAttendance = await attendanceService.getAttendanceById(id);

    await attendanceService.deleteAttendance(
      req.user!.userId,
      req.user!.role,
      id,
    );

    await logActivity({
      req,
      actorId: req.user!.userId,
      action: AuditAction.DELETE,
      entity: "Attendance",
      entityId: id,
      description: "Attendance record deleted",
      oldData: {
        studentId: oldAttendance.studentId,
        courseId: oldAttendance.courseId,
        facultyId: oldAttendance.facultyId,
        date: oldAttendance.date.toISOString(),
        status: oldAttendance.status,
        remarks: oldAttendance.remarks ?? null,
      },
      newData: {
        deleted: true,
        deletedAt: new Date().toISOString(),
      },
    });

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