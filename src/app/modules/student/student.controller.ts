import type { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

import sendResponse from "../../utils/sendResponse.js";
import { studentService } from "./student.service.js";
import {
  studentIdParamSchema,
  studentQuerySchema,
  updateStudentSchema,
} from "./student.validation.js";

const getAllStudents = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<Response | void> => {
  try {
    const query = studentQuerySchema.parse(req.query);
    const result = await studentService.getAllStudents(query);

    return sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Students retrieved successfully",
      data: result,
    });
  } catch (error) {
    return next(error);
  }
};

const getStudentById = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<Response | void> => {
  try {
    const { id } = studentIdParamSchema.parse(req.params);
    const result = await studentService.getStudentById(id);

    return sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Student retrieved successfully",
      data: result,
    });
  } catch (error) {
    return next(error);
  }
};

const updateStudent = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<Response | void> => {
  try {
    const { id } = studentIdParamSchema.parse(req.params);
    const payload = updateStudentSchema.parse(req.body);

    const result = await studentService.updateStudent(id, payload);

    return sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Student updated successfully",
      data: result,
    });
  } catch (error) {
    return next(error);
  }
};

const deleteStudent = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<Response | void> => {
  try {
    const { id } = studentIdParamSchema.parse(req.params);

    await studentService.deleteStudent(id);

    return sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Student deleted successfully",
      data: null,
    });
  } catch (error) {
    return next(error);
  }
};

export const studentController = {
  getAllStudents,
  getStudentById,
  updateStudent,
  deleteStudent,
};