import type {
  NextFunction,
  Request,
  Response,
} from "express";

import {
  AuditAction,
} from "@prisma/client";

import { StatusCodes } from "http-status-codes";

import sendResponse from "../../utils/sendResponse.js";
import { logActivity } from "../../utils/auditLog.js";

import { courseService } from "./course.service.js";

import {
  courseIdParamSchema,
  courseQuerySchema,
  createCourseSchema,
  updateCourseSchema,
} from "./course.validation.js";

const createCourse = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<Response | void> => {
  try {
    const payload =
      createCourseSchema.parse(req.body);

    const result =
      await courseService.createCourse(payload);

    await logActivity({
      req,
      actorId: req.user?.userId,

      action: AuditAction.CREATE,

      entity: "Course",

      entityId: result.id,

      description: "New course created",

      newData: {
        code: result.code,
        title: result.title,
        description: result.description,
        credit: result.credit,
        departmentId: result.departmentId,
        facultyId: result.facultyId,
        semester: result.semester,
        capacity: result.capacity,
        isActive: result.isActive,

        department: {
          id: result.department.id,
          name: result.department.name,
          code: result.department.code,
        },

        faculty: result.faculty
          ? {
              id: result.faculty.id,
              employeeId:
                result.faculty.employeeId,
              designation:
                result.faculty.designation,

              user: {
                id: result.faculty.user.id,
                name: result.faculty.user.name,
                email: result.faculty.user.email,
              },
            }
          : null,
      },
    });

    return sendResponse(res, {
      statusCode: StatusCodes.CREATED,
      success: true,
      message: "Course created successfully",
      data: result,
    });
  } catch (error) {
    return next(error);
  }
};

const getAllCourses = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<Response | void> => {
  try {
    const query =
      courseQuerySchema.parse(req.query);

    const result =
      await courseService.getAllCourses(query);

    return sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Courses retrieved successfully",
      data: result,
    });
  } catch (error) {
    return next(error);
  }
};

const getCourseById = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<Response | void> => {
  try {
    const { id } =
      courseIdParamSchema.parse(req.params);

    const result =
      await courseService.getCourseById(id);

    return sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Course retrieved successfully",
      data: result,
    });
  } catch (error) {
    return next(error);
  }
};

const updateCourse = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<Response | void> => {
  try {
    const { id } =
      courseIdParamSchema.parse(req.params);

    const payload =
      updateCourseSchema.parse(req.body);

    // Capture old data before update
    const oldCourse =
      await courseService.getCourseById(id);

    // Update course
    const result =
      await courseService.updateCourse(
        id,
        payload,
      );

    await logActivity({
      req,
      actorId: req.user?.userId,

      action: AuditAction.UPDATE,

      entity: "Course",

      entityId: id,

      description: "Course information updated",

      oldData: {
        code: oldCourse.code,
        title: oldCourse.title,
        description: oldCourse.description,
        credit: oldCourse.credit,
        departmentId:
          oldCourse.departmentId,
        facultyId: oldCourse.facultyId,
        semester: oldCourse.semester,
        capacity: oldCourse.capacity,
        isActive: oldCourse.isActive,

        department: {
          id: oldCourse.department.id,
          name: oldCourse.department.name,
          code: oldCourse.department.code,
        },

        faculty: oldCourse.faculty
          ? {
              id: oldCourse.faculty.id,
              employeeId:
                oldCourse.faculty.employeeId,
              designation:
                oldCourse.faculty.designation,

              user: {
                id: oldCourse.faculty.user.id,
                name: oldCourse.faculty.user.name,
                email:
                  oldCourse.faculty.user.email,
              },
            }
          : null,
      },

      newData: {
        code: result.code,
        title: result.title,
        description: result.description,
        credit: result.credit,
        departmentId:
          result.departmentId,
        facultyId: result.facultyId,
        semester: result.semester,
        capacity: result.capacity,
        isActive: result.isActive,

        department: {
          id: result.department.id,
          name: result.department.name,
          code: result.department.code,
        },

        faculty: result.faculty
          ? {
              id: result.faculty.id,
              employeeId:
                result.faculty.employeeId,
              designation:
                result.faculty.designation,

              user: {
                id: result.faculty.user.id,
                name: result.faculty.user.name,
                email:
                  result.faculty.user.email,
              },
            }
          : null,
      },
    });

    return sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Course updated successfully",
      data: result,
    });
  } catch (error) {
    return next(error);
  }
};

const updateCourseStatus = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<Response | void> => {
  try {
    const { id } =
      courseIdParamSchema.parse(req.params);

    const isActive = req.body.isActive;

    if (typeof isActive !== "boolean") {
      return next(
        new Error(
          "isActive must be a boolean value",
        ),
      );
    }

    // Capture old course status
    const oldCourse =
      await courseService.getCourseById(id);

    const result =
      await courseService.updateCourseStatus(
        id,
        isActive,
      );

    await logActivity({
      req,
      actorId: req.user?.userId,

      action: AuditAction.STATUS_CHANGE,

      entity: "Course",

      entityId: id,

      description: `Course status changed from ${
        oldCourse.isActive
          ? "ACTIVE"
          : "INACTIVE"
      } to ${
        result.isActive
          ? "ACTIVE"
          : "INACTIVE"
      }`,

      oldData: {
        isActive: oldCourse.isActive,
      },

      newData: {
        isActive: result.isActive,
      },
    });

    return sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message:
        "Course status updated successfully",
      data: result,
    });
  } catch (error) {
    return next(error);
  }
};

const deleteCourse = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<Response | void> => {
  try {
    const { id } =
      courseIdParamSchema.parse(req.params);

    // Capture old course before deletion
    const course =
      await courseService.getCourseById(id);

    // Soft delete
    await courseService.deleteCourse(id);

    await logActivity({
      req,
      actorId: req.user?.userId,

      action: AuditAction.DELETE,

      entity: "Course",

      entityId: id,

      description: "Course soft deleted",

      oldData: {
        code: course.code,
        title: course.title,
        description: course.description,
        credit: course.credit,
        departmentId: course.departmentId,
        facultyId: course.facultyId,
        semester: course.semester,
        capacity: course.capacity,
        isActive: course.isActive,

        department: {
          id: course.department.id,
          name: course.department.name,
          code: course.department.code,
        },

        faculty: course.faculty
          ? {
              id: course.faculty.id,
              employeeId:
                course.faculty.employeeId,
              designation:
                course.faculty.designation,
            }
          : null,

        counts: {
          enrollments:
            course._count.enrollments,
          attendances:
            course._count.attendances,
          results: course._count.results,
        },
      },

      newData: {
        deleted: true,
        deletedAt: new Date().toISOString(),
        isActive: false,
      },
    });

    return sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Course deleted successfully",
      data: null,
    });
  } catch (error) {
    return next(error);
  }
};

export const courseController = {
  createCourse,
  getAllCourses,
  getCourseById,
  updateCourse,
  updateCourseStatus,
  deleteCourse,
};