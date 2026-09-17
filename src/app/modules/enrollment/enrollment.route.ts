import { Router } from "express";

import {
  authenticate,
  authorize,
} from "../../middlewares/auth.js";

import { enrollmentController } from "./enrollment.controller.js";

const router = Router();

router.use(authenticate);

// Student: create enrollment request
router.post(
  "/",
  authorize("STUDENT"),
  enrollmentController.createEnrollment,
);

// Student: view own enrollments
router.get(
  "/my",
  authorize("STUDENT"),
  enrollmentController.getMyEnrollments,
);

// Student: cancel own pending enrollment
router.patch(
  "/:id/cancel",
  authorize("STUDENT"),
  enrollmentController.cancelMyEnrollment,
);

// Admin: view all enrollments
router.get(
  "/",
  authorize("ADMIN"),
  enrollmentController.getEnrollments,
);

// Admin, Faculty and Student: view a specific enrollment
router.get(
  "/:id",
  authorize("ADMIN", "FACULTY", "STUDENT"),
  enrollmentController.getEnrollmentById,
);

// Admin: approve or reject enrollment
router.patch(
  "/:id/status",
  authorize("ADMIN"),
  enrollmentController.updateEnrollmentStatus,
);

export default router;