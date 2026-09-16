import { Router } from "express";
import AppError from "../errors/AppError.js";
import catchAsync from "../middlewares/catchAsync.js";

const router = Router();

router.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "API is healthy",
    data: {
      status: "OK",
    },
  });
});

router.get(
  "/test-error",
  catchAsync(async () => {
    throw new AppError(400, "This is a test error");
  }),
);

export default router;