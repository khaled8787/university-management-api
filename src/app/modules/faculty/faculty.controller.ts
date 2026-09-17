import type {
  NextFunction,
  Request,
  Response,
} from "express";

import { StatusCodes } from "http-status-codes";

import sendResponse from "../../utils/sendResponse.js";
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

    const result = await facultyService.getAllFaculties(query);

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
    const { id } = facultyIdParamSchema.parse(req.params);

    const result = await facultyService.getFacultyById(id);

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
    const { id } = facultyIdParamSchema.parse(req.params);

    const payload = updateFacultySchema.parse(req.body);

    const result = await facultyService.updateFaculty(id, payload);

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
    const { id } = facultyIdParamSchema.parse(req.params);

    await facultyService.deleteFaculty(id);

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