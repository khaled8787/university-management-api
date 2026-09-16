import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import AppError from "./AppError.js";

const globalErrorHandler: ErrorRequestHandler = (
  error,
  _req,
  res,
  _next,
) => {
  let statusCode = 500;
  let message = "Something went wrong";
  let errors: unknown[] = [];

  if (error instanceof AppError) {
    statusCode = error.statusCode;
    message = error.message;
    errors = error.errors;
  } else if (error instanceof ZodError) {
    statusCode = 400;
    message = "Validation failed";

    errors = error.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    }));
  } else if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      statusCode = 409;
      message = "Duplicate value detected";
    } else if (error.code === "P2025") {
      statusCode = 404;
      message = "Requested record not found";
    }

    errors = [
      {
        code: error.code,
        details: error.meta ?? {},
      },
    ];
  } else if (error instanceof Error) {
    message = error.message;
  }

  res.status(statusCode).json({
    success: false,
    message,
    errors,
  });
};

export default globalErrorHandler;