
import type { NextFunction, Request, Response } from "express";
import { AuditAction } from "@prisma/client";
import { StatusCodes } from "http-status-codes";
import AppError from "../../errors/AppError.js";
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

// Admin: list all results using optional filters.
export const getResults = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<Response | void> => {
  try {
    const query = resultQuerySchema.parse(req.query);
    const result = await resultService.getAllResults(query);

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

// Faculty: list results only for their currently assigned courses.
export const getFacultyResults = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<Response | void> => {
  try {
    const query = resultQuerySchema.parse(req.query);

    const result = await resultService.getFacultyResults(
      req.user!.userId,
      query,
    );

    return sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Your course results retrieved successfully",
      data: result,
    });
  } catch (error) {
    return next(error);
  }
};

// Student: list only their own results.
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
    const role = req.user!.role;

    if (role === "STUDENT") {
      const ownResults = await resultService.getMyResults(
        req.user!.userId,
        {
          page: 1,
          limit: 1,
          studentId: result.studentId,
          courseId: result.courseId,
          sortOrder: "desc",
        },
      );

      if (ownResults.meta.total === 0) {
        throw new AppError(
  StatusCodes.FORBIDDEN,
  "You can view only your own results",
);
      }
    } else if (role === "FACULTY") {
      const facultyResults = await resultService.getFacultyResults(
        req.user!.userId,
        {
          page: 1,
          limit: 1,
          studentId: result.studentId,
          courseId: result.courseId,
          sortOrder: "desc",
        },
      );

      if (facultyResults.meta.total === 0) {
        throw new AppError(
  StatusCodes.FORBIDDEN,
  "You can view results only for your assigned courses",
);
      }
    }

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

    // The service enforces Faculty ownership before updating.
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

    const oldResult = await resultService.getResultById(id);

    const deletedResult = await resultService.deleteResult(
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
      description: "Student result soft deleted",
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
        deletedAt: deletedResult.deletedAt?.toISOString() ?? null,
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
