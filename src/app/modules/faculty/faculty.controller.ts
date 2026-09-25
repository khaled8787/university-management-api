import type {
  NextFunction,
  Request,
  Response,
} from "express";

import { AuditAction } from "@prisma/client";
import { StatusCodes } from "http-status-codes";

import sendResponse from "../../utils/sendResponse.js";
import { logActivity } from "../../utils/auditLog.js";

import { facultyService } from "./faculty.service.js";

import {
  facultyIdParamSchema,
  facultyQuerySchema,
  updateFacultySchema,
} from "./faculty.validation.js";

const getAllFaculties = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<Response | void> => {
  try {
    const query = facultyQuerySchema.parse(req.query);

    const result =
      await facultyService.getAllFaculties(query);

    return sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Faculties retrieved successfully",
      data: result,
    });
  } catch (error) {
    return next(error);
  }
};

const getFacultyById = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<Response | void> => {
  try {
    const { id } =
      facultyIdParamSchema.parse(req.params);

    const result =
      await facultyService.getFacultyById(id);

    return sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Faculty retrieved successfully",
      data: result,
    });
  } catch (error) {
    return next(error);
  }
};

const updateFaculty = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<Response | void> => {
  try {
    const { id } =
      facultyIdParamSchema.parse(req.params);

    const payload =
      updateFacultySchema.parse(req.body);

    // Get previous data before update
    const oldFaculty =
      await facultyService.getFacultyById(id);

    // Update faculty
    const result =
      await facultyService.updateFaculty(
        id,
        payload,
      );

    // Create audit log
    await logActivity({
      req,
      actorId: req.user?.userId,

      action: AuditAction.UPDATE,

      entity: "Faculty",

      entityId: id,

      description: "Faculty information updated",

      oldData: {
        employeeId: oldFaculty.employeeId,
        designation: oldFaculty.designation,
        phone: oldFaculty.phone,
        specialization: oldFaculty.specialization,
        departmentId: oldFaculty.departmentId,

        department: {
          id: oldFaculty.department.id,
          name: oldFaculty.department.name,
          code: oldFaculty.department.code,
        },

        user: {
          id: oldFaculty.user.id,
          name: oldFaculty.user.name,
          email: oldFaculty.user.email,
          status: oldFaculty.user.status,
        },
      },

      newData: {
        employeeId: result.employeeId,
        designation: result.designation,
        phone: result.phone,
        specialization: result.specialization,
        departmentId: result.departmentId,

        department: {
          id: result.department.id,
          name: result.department.name,
          code: result.department.code,
        },

        user: {
          id: result.user.id,
          name: result.user.name,
          email: result.user.email,
          status: result.user.status,
        },
      },
    });

    return sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Faculty updated successfully",
      data: result,
    });
  } catch (error) {
    return next(error);
  }
};

const deleteFaculty = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<Response | void> => {
  try {
    const { id } =
      facultyIdParamSchema.parse(req.params);

    // Get faculty before soft delete
    const faculty =
      await facultyService.getFacultyById(id);

    // Soft delete
    await facultyService.deleteFaculty(id);

    // Create audit log
    await logActivity({
      req,
      actorId: req.user?.userId,

      action: AuditAction.DELETE,

      entity: "Faculty",

      entityId: id,

      description: "Faculty account soft deleted",

      oldData: {
        employeeId: faculty.employeeId,
        designation: faculty.designation,
        phone: faculty.phone,
        specialization: faculty.specialization,
        departmentId: faculty.departmentId,

        department: {
          id: faculty.department.id,
          name: faculty.department.name,
          code: faculty.department.code,
        },

        user: {
          id: faculty.user.id,
          name: faculty.user.name,
          email: faculty.user.email,
          status: faculty.user.status,
        },
      },

      newData: {
        deleted: true,
        deletedAt: new Date().toISOString(),
      },
    });

    return sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Faculty deleted successfully",
      data: null,
    });
  } catch (error) {
    return next(error);
  }
};

export const facultyController = {
  getAllFaculties,
  getFacultyById,
  updateFaculty,
  deleteFaculty,
};