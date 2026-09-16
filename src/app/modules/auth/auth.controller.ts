import type { RequestHandler } from "express";
import { StatusCodes } from "http-status-codes";

import catchAsync from "../../middlewares/catchAsync.js";
import sendResponse from "../../utils/sendResponse.js";
import {
  loginValidationSchema,
  refreshTokenValidationSchema,
  registerValidationSchema,
} from "./auth.validation.js";
import {
  getCurrentUser,
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

export const logout: RequestHandler = (_req, res) => {
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message:
      "Logout successful. Please remove the access and refresh tokens from the client.",
    data: null,
  });
};