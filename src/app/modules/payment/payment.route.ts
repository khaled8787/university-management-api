import { Router } from "express";

import {
  authenticate,
  authorize,
} from "../../middlewares/auth.js";

import {
  cancelPaymentController,
  createPaymentController,
  getAdminPaymentByIdController,
  getAllPaymentsController,
  getMyPaymentByIdController,
  getMyPaymentsController,
} from "./payment.controller.js";

const router = Router();

router.use(authenticate);

// Student routes
router.post(
  "/",
  authorize("STUDENT"),
  createPaymentController,
);

router.get(
  "/my",
  authorize("STUDENT"),
  getMyPaymentsController,
);

router.get(
  "/my/:id",
  authorize("STUDENT"),
  getMyPaymentByIdController,
);

router.patch(
  "/:id/cancel",
  authorize("STUDENT"),
  cancelPaymentController,
);

// Admin routes
router.get(
  "/",
  authorize("ADMIN"),
  getAllPaymentsController,
);

router.get(
  "/admin/:id",
  authorize("ADMIN"),
  getAdminPaymentByIdController,
);

export default router;