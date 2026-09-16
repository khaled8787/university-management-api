import type { Response } from "express";

interface SendResponseOptions<T> {
  statusCode: number;
  success: boolean;
  message: string;
  data: T;
}

const sendResponse = <T>(
  res: Response,
  options: SendResponseOptions<T>,
): Response => {
  return res.status(options.statusCode).json({
    success: options.success,
    message: options.message,
    data: options.data,
  });
};

export default sendResponse;