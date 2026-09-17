import type {
  NextFunction,
  Request,
  Response,
} from "express";

import { StatusCodes } from "http-status-codes";

import sendResponse from "../../utils/sendResponse.js";
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
    const payload = createCourseSchema.parse(req.body);

    const result = await courseService.createCourse(payload);

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
    const query = courseQuerySchema.parse(req.query);

    const result = await courseService.getAllCourses(query);

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
    const { id } = courseIdParamSchema.parse(req.params);

    const result = await courseService.getCourseById(id);

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
    const { id } = courseIdParamSchema.parse(req.params);

    const payload = updateCourseSchema.parse(req.body);

    const result = await courseService.updateCourse(id, payload);

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
    const { id } = courseIdParamSchema.parse(req.params);

    const isActive = req.body.isActive;

    if (typeof isActive !== "boolean") {
      return next(
        new Error("isActive must be a boolean value"),
      );
    }

    const result = await courseService.updateCourseStatus(
      id,
      isActive,
    );

    return sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Course status updated successfully",
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
    const { id } = courseIdParamSchema.parse(req.params);

    await courseService.deleteCourse(id);

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