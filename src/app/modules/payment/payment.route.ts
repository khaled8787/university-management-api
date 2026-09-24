import { Router } from "express";

import {
  authenticate,
  authorize,
} from "../../middlewares/auth.js";
import express from "express";
import {
  cancelPaymentController,
  createPaymentController,
  createStripeCheckoutController,
  getAdminPaymentByIdController,
  getAllPaymentsController,
  getMyPaymentByIdController,
  getMyPaymentsController,
  stripeWebhookController,
} from "./payment.controller.js";

const router = Router();

router.post("/stripe/webhook", stripeWebhookController);

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

router.post(
  "/:id/stripe-checkout",
  authorize("STUDENT"),
  createStripeCheckoutController,
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