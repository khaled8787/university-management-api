import type { RequestHandler } from "express";
import { StatusCodes } from "http-status-codes";

import catchAsync from "../../middlewares/catchAsync.js";
import sendResponse from "../../utils/sendResponse.js";

import {
  getAuditLogById,
  getAuditLogs,
} from "./auditLog.service.js";

import {
  auditLogIdSchema,
  auditLogQuerySchema,
} from "./auditLog.validation.js";

export const getAllAuditLogs: RequestHandler = catchAsync(
  async (req, res) => {
    const query = auditLogQuerySchema.parse(req.query);

    const result = await getAuditLogs(query);

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Audit logs retrieved successfully",
      data: result,
    });
  },
);

export const getSingleAuditLog: RequestHandler = catchAsync(
  async (req, res) => {
    const { id } = auditLogIdSchema.parse(req.params);

    const result = await getAuditLogById(id);

    if (!result) {
      res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "Audit log not found",
        errors: [],
      });

      return;
    }

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Audit log retrieved successfully",
      data: result,
    });
  },
);