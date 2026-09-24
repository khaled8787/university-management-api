import type { RequestHandler } from "express";
import { StatusCodes } from "http-status-codes";
import { AuditAction } from "@prisma/client";
import { logActivity } from "../../utils/auditLog.js";
import catchAsync from "../../middlewares/catchAsync.js";
import sendResponse from "../../utils/sendResponse.js";
import {
  googleLoginValidationSchema,
  loginValidationSchema,
  refreshTokenValidationSchema,
  registerValidationSchema,
} from "./auth.validation.js";
import {
  getCurrentUser,
  googleLoginUser,
  loginUser,
  refreshAccessToken,
  registerUser,
} from "./auth.service.js";

export const register: RequestHandler = catchAsync(async (req, res) => {
  const validatedData = registerValidationSchema.parse(req.body);

  const result = await registerUser(validatedData);

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "User registered successfully",
    data: result,
  });
});

export const login: RequestHandler = catchAsync(async (req, res) => {
  const validatedData = loginValidationSchema.parse(req.body);

  const result = await loginUser(validatedData);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Login successful",
    data: result,
  });
});

export const refreshToken: RequestHandler = catchAsync(async (req, res) => {
  const { refreshToken: token } = refreshTokenValidationSchema.parse(
    req.body,
  );

  const result = await refreshAccessToken(token);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Access token refreshed successfully",
    data: result,
  });
});

export const getMe: RequestHandler = catchAsync(async (req, res) => {
  const userId = req.user?.userId;

  if (!userId) {
    res.status(StatusCodes.UNAUTHORIZED).json({
      success: false,
      message: "Authentication required",
      errors: [],
    });
    return;
  }

  const result = await getCurrentUser(userId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Current user retrieved successfully",
    data: result,
  });
});

export const logout: RequestHandler = catchAsync(async (req, res) => {
  const userId = req.user?.userId;

  if (userId) {
    await logActivity({
      req,
      actorId: userId,
      action: AuditAction.LOGOUT,
      entity: "User",
      entityId: userId,
      description: "User logged out successfully",
    });
  }

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message:
      "Logout successful. Please remove the access and refresh tokens from the client.",
    data: null,
  });
});

export const googleLogin: RequestHandler = catchAsync(
  async (req, res) => {
    const validatedData =
      googleLoginValidationSchema.parse(req.body);

    const result =
      await googleLoginUser(validatedData);

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Google login successful",
      data: result,
    });
  },
);