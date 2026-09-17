import type { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

import sendResponse from "../../utils/sendResponse.js";
import { departmentService } from "./department.service.js";
import {
  createDepartmentSchema,
  departmentQuerySchema,
  updateDepartmentSchema,
} from "./department.validation.js";

const createDepartment = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<Response | void> => {
  try {
    const payload = createDepartmentSchema.parse(req.body);

    const result = await departmentService.createDepartment(payload);

    return sendResponse(res, {
      statusCode: StatusCodes.CREATED,
      success: true,
      message: "Department created successfully",
      data: result,
    });
  } catch (error) {
    return next(error);
  }
};

const getAllDepartments = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<Response | void> => {
  try {
    const query = departmentQuerySchema.parse(req.query);

    const result = await departmentService.getAllDepartments(query);

    return sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Departments retrieved successfully",
      data: result,
    });
  } catch (error) {
    return next(error);
  }
};

const getDepartmentById = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<Response | void> => {
  try {
    const result = await departmentService.getDepartmentById(req.params.id);

    return sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Department retrieved successfully",
      data: result,
    });
  } catch (error) {
    return next(error);
  }
};

const updateDepartment = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<Response | void> => {
  try {
    const payload = updateDepartmentSchema.parse(req.body);

    const result = await departmentService.updateDepartment(
      req.params.id,
      payload,
    );

    return sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Department updated successfully",
      data: result,
    });
  } catch (error) {
    return next(error);
  }
};

const deleteDepartment = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<Response | void> => {
  try {
    const result = await departmentService.deleteDepartment(req.params.id);

    return sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Department deleted successfully",
      data: result,
    });
  } catch (error) {
    return next(error);
  }
};

export const departmentController = {
  createDepartment,
  getAllDepartments,
  getDepartmentById,
  updateDepartment,
  deleteDepartment,
};