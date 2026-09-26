import type {
  NextFunction,
  Request,
  Response,
} from "express";

import { AuditAction } from "@prisma/client";
import { StatusCodes } from "http-status-codes";

import sendResponse from "../../utils/sendResponse.js";
import { logActivity } from "../../utils/auditLog.js";

import { enrollmentService } from "./enrollment.service.js";

import {
  createEnrollmentSchema,
  enrollmentIdParamSchema,
  enrollmentQuerySchema,
  updateEnrollmentStatusSchema,
} from "./enrollment.validation.js";

// ============================================================
// CREATE ENROLLMENT
// ============================================================

const createEnrollment = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<Response | void> => {
  try {
    if (!req.user?.userId) {
      return next(
        new Error("Authenticated user not found"),
      );
    }

    const payload =
      createEnrollmentSchema.parse(req.body);

    const result =
      await enrollmentService.createEnrollment(
        req.user.userId,
        payload,
      );

    await logActivity({
      req,
      actorId: req.user.userId,

      action: AuditAction.ENROLLMENT,

      entity: "Enrollment",

      entityId: result.id,

      description:
        "Student submitted a new enrollment request",

      newData: {
        studentId: result.studentId,
        courseId: result.courseId,
        status: result.status,

        student: {
          id: result.student.id,
          studentId: result.student.studentId,
          semester: result.student.semester,
          batch: result.student.batch,

          user: {
            id: result.student.user.id,
            name: result.student.user.name,
            email: result.student.user.email,
          },
        },

        course: {
          id: result.course.id,
          code: result.course.code,
          title: result.course.title,
          credit: result.course.credit,
          semester: result.course.semester,
          capacity: result.course.capacity,
          isActive: result.course.isActive,
        },
      },
    });

    return sendResponse(res, {
      statusCode: StatusCodes.CREATED,
      success: true,
      message:
        "Enrollment request created successfully",
      data: result,
    });
  } catch (error) {
    return next(error);
  }
};

// ============================================================
// GET MY ENROLLMENTS
// ============================================================

const getMyEnrollments = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<Response | void> => {
  try {
    if (!req.user?.userId) {
      return next(
        new Error("Authenticated user not found"),
      );
    }

    const query =
      enrollmentQuerySchema.parse(req.query);

    const result =
      await enrollmentService.getMyEnrollments(
        req.user.userId,
        query,
      );

    return sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message:
        "Your enrollments retrieved successfully",
      data: result,
    });
  } catch (error) {
    return next(error);
  }
};

// ============================================================
// GET ALL ENROLLMENTS
// ============================================================

const getEnrollments = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<Response | void> => {
  try {
    const query =
      enrollmentQuerySchema.parse(req.query);

    const result =
      await enrollmentService.getEnrollments(
        query,
      );

    return sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message:
        "Enrollments retrieved successfully",
      data: result,
    });
  } catch (error) {
    return next(error);
  }
};

// ============================================================
// GET SINGLE ENROLLMENT
// ============================================================

const getEnrollmentById = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<Response | void> => {
  try {
    const { id } =
      enrollmentIdParamSchema.parse(
        req.params,
      );

    const result =
      await enrollmentService.getEnrollmentById(
        id,
      );

    return sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message:
        "Enrollment retrieved successfully",
      data: result,
    });
  } catch (error) {
    return next(error);
  }
};

// ============================================================
// UPDATE ENROLLMENT STATUS
// ============================================================

const updateEnrollmentStatus = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<Response | void> => {
  try {
    const { id } =
      enrollmentIdParamSchema.parse(
        req.params,
      );

    const payload =
      updateEnrollmentStatusSchema.parse(
        req.body,
      );

    // --------------------------------------------------------
    // Get old enrollment before status change
    // --------------------------------------------------------

    const oldEnrollment =
      await enrollmentService.getEnrollmentById(
        id,
      );

    // --------------------------------------------------------
    // Update status
    // --------------------------------------------------------

    const result =
      await enrollmentService.updateEnrollmentStatus(
        id,
        payload,
      );

    // --------------------------------------------------------
    // Audit log
    // --------------------------------------------------------

    await logActivity({
      req,
      actorId: req.user?.userId,

      action: AuditAction.ENROLLMENT,

      entity: "Enrollment",

      entityId: id,

      description:
        `Enrollment status changed from ${oldEnrollment.status} to ${result.status}`,

      oldData: {
        status: oldEnrollment.status,

        student: {
          id: oldEnrollment.student.id,
          studentId:
            oldEnrollment.student.studentId,

          user: {
            id: oldEnrollment.student.user.id,
            name:
              oldEnrollment.student.user.name,
            email:
              oldEnrollment.student.user.email,
          },
        },

        course: {
          id: oldEnrollment.course.id,
          code: oldEnrollment.course.code,
          title:
            oldEnrollment.course.title,
        },
      },

      newData: {
        status: result.status,

        student: {
          id: result.student.id,
          studentId:
            result.student.studentId,

          user: {
            id: result.student.user.id,
            name: result.student.user.name,
            email:
              result.student.user.email,
          },
        },

        course: {
          id: result.course.id,
          code: result.course.code,
          title: result.course.title,
        },
      },
    });

    return sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message:
        "Enrollment status updated successfully",
      data: result,
    });
  } catch (error) {
    return next(error);
  }
};

// ============================================================
// CANCEL MY ENROLLMENT
// ============================================================

const cancelMyEnrollment = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<Response | void> => {
  try {
    if (!req.user?.userId) {
      return next(
        new Error("Authenticated user not found"),
      );
    }

    const { id } =
      enrollmentIdParamSchema.parse(
        req.params,
      );

    // --------------------------------------------------------
    // Get enrollment before cancellation
    // --------------------------------------------------------

    const enrollment =
      await enrollmentService.getEnrollmentById(
        id,
      );

    // --------------------------------------------------------
    // Cancel enrollment
    // --------------------------------------------------------

    await enrollmentService.cancelMyEnrollment(
      req.user.userId,
      id,
    );

    // --------------------------------------------------------
    // Audit log
    // --------------------------------------------------------

    await logActivity({
      req,
      actorId: req.user.userId,

      action: AuditAction.ENROLLMENT,

      entity: "Enrollment",

      entityId: id,

      description:
        "Student cancelled enrollment request",

      oldData: {
        status: enrollment.status,

        student: {
          id: enrollment.student.id,
          studentId:
            enrollment.student.studentId,

          user: {
            id: enrollment.student.user.id,
            name:
              enrollment.student.user.name,
            email:
              enrollment.student.user.email,
          },
        },

        course: {
          id: enrollment.course.id,
          code: enrollment.course.code,
          title:
            enrollment.course.title,
        },
      },

      newData: {
        status: EnrollmentStatus.DROPPED,
      },
    });

    return sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message:
        "Enrollment cancelled successfully",
      data: null,
    });
  } catch (error) {
    return next(error);
  }
};

// ============================================================
// EXPORT
// ============================================================

export const enrollmentController = {
  createEnrollment,
  getMyEnrollments,
  getEnrollments,
  getEnrollmentById,
  updateEnrollmentStatus,
  cancelMyEnrollment,
};