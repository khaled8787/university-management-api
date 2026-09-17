import type { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import sendResponse from "../../utils/sendResponse.js";
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

    const result = await resultService.updateResult(
      req.user!.userId,
      req.user!.role,
      id,
      payload,
    );

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

    await resultService.deleteResult(
      req.user!.userId,
      req.user!.role,
      id,
    );

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