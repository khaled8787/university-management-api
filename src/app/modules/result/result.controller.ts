import type { NextFunction, Request, Response } from "express";
import { AuditAction } from "@prisma/client";
import { StatusCodes } from "http-status-codes";

import sendResponse from "../../utils/sendResponse.js";
import { logActivity } from "../../utils/auditLog.js";
import { resultService } from "./result.service.js";
import {
  createResultSchema,
  resultIdSchema,
  resultQuerySchema,
  updateResultSchema,
} from "./result.validation.js";

export const createResult = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<Response | void> => {
  try {
    const payload = createResultSchema.parse(req.body);

    const result = await resultService.createResult(
      req.user!.userId,
      req.user!.role,
      payload,
    );

    await logActivity({
      req,
      actorId: req.user!.userId,
      action: AuditAction.CREATE,
      entity: "Result",
      entityId: result.id,
      description: "Student result created",
      newData: {
        studentId: result.studentId,
        courseId: result.courseId,
        facultyId: result.facultyId,
        marks: result.marks,
        grade: result.grade,
        gradePoint: result.gradePoint,
        remarks: result.remarks ?? null,
      },
    });

    return sendResponse(res, {
      statusCode: StatusCodes.CREATED,
      success: true,
      message: "Result created successfully",
      data: result,
    });
  } catch (error) {
    return next(error);
  }
};

export const getResults = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<Response | void> => {
  try {
    const query = resultQuerySchema.parse(req.query);
    const result = await resultService.getResults(query);

    return sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Results retrieved successfully",
      data: result,
    });
  } catch (error) {
    return next(error);
  }
};

export const getMyResults = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<Response | void> => {
  try {
    const query = resultQuerySchema.parse(req.query);

    const result = await resultService.getMyResults(
      req.user!.userId,
      query,
    );

    return sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Your results retrieved successfully",
      data: result,
    });
  } catch (error) {
    return next(error);
  }
};

export const getResultById = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<Response | void> => {
  try {
    const { id } = resultIdSchema.parse(req.params);
    const result = await resultService.getResultById(id);

    return sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Result retrieved successfully",
      data: result,
    });
  } catch (error) {
    return next(error);
  }
};

export const updateResult = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<Response | void> => {
  try {
    const { id } = resultIdSchema.parse(req.params);
    const payload = updateResultSchema.parse(req.body);

    // Capture old data before update for audit history.
    const oldResult = await resultService.getResultById(id);

    const result = await resultService.updateResult(
      req.user!.userId,
      req.user!.role,
      id,
      payload,
    );

    await logActivity({
      req,
      actorId: req.user!.userId,
      action: AuditAction.UPDATE,
      entity: "Result",
      entityId: result.id,
      description: "Student result updated",
      oldData: {
        studentId: oldResult.studentId,
        courseId: oldResult.courseId,
        facultyId: oldResult.facultyId,
        marks: oldResult.marks,
        grade: oldResult.grade,
        gradePoint: oldResult.gradePoint,
        remarks: oldResult.remarks ?? null,
      },
      newData: {
        studentId: result.studentId,
        courseId: result.courseId,
        facultyId: result.facultyId,
        marks: result.marks,
        grade: result.grade,
        gradePoint: result.gradePoint,
        remarks: result.remarks ?? null,
      },
    });

    return sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Result updated successfully",
      data: result,
    });
  } catch (error) {
    return next(error);
  }
};

export const deleteResult = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<Response | void> => {
  try {
    const { id } = resultIdSchema.parse(req.params);

    // Capture old data before deletion for audit history.
    const oldResult = await resultService.getResultById(id);

    await resultService.deleteResult(
      req.user!.userId,
      req.user!.role,
      id,
    );

    await logActivity({
      req,
      actorId: req.user!.userId,
      action: AuditAction.DELETE,
      entity: "Result",
      entityId: id,
      description: "Student result deleted",
      oldData: {
        studentId: oldResult.studentId,
        courseId: oldResult.courseId,
        facultyId: oldResult.facultyId,
        marks: oldResult.marks,
        grade: oldResult.grade,
        gradePoint: oldResult.gradePoint,
        remarks: oldResult.remarks ?? null,
      },
      newData: {
        deleted: true,
        deletedAt: new Date().toISOString(),
      },
    });

    return sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Result deleted successfully",
      data: null,
    });
  } catch (error) {
    return next(error);
  }
};