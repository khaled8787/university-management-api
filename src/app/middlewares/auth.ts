import type { RequestHandler } from "express";
import AppError from "../errors/AppError.js";
import { verifyAccessToken } from "../utils/jwt.js";

export type AuthenticatedUser = {
  userId: string;
  role: string;
};

export const authenticate = ((req, _res, next) => {
  try {
    const authorization = req.headers.authorization;

    if (!authorization?.startsWith("Bearer ")) {
      throw new AppError(401, "Bearer access token is required");
    }

    const token = authorization.split(" ")[1];

    if (!token) {
      throw new AppError(401, "Access token is required");
    }

    const decodedUser = verifyAccessToken(token);

    req.user = decodedUser;

    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
      return;
    }

    next(new AppError(401, "Invalid or expired access token"));
  }
}) as RequestHandler;

export const authorize = (...allowedRoles: string[]): RequestHandler => {
  return (req, _res, next) => {
    if (!req.user) {
      next(new AppError(401, "Authentication required"));
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      next(
        new AppError(
          403,
          "You do not have permission to access this resource",
        ),
      );
      return;
    }

    next();
  };
};