
import { Router } from "express";

import { authenticate, authorize } from "../../middlewares/auth.js";

import {
  createResult,
  deleteResult,
  getFacultyResults,
  getMyResults,
  getResultById,
  getResults,
  updateResult,
} from "./result.controller.js";

const router = Router();

router.use(authenticate);

// Student: own results
router.get(
  "/my",
  authorize("STUDENT"),
  getMyResults,
);

// Faculty: results for their assigned courses only
router.get(
  "/my-courses",
  authorize("FACULTY"),
  getFacultyResults,
);

// Admin: all results
router.get(
  "/",
  authorize("ADMIN"),
  getResults,
);

// Faculty/Admin: create result
router.post(
  "/",
  authorize("ADMIN", "FACULTY"),
  createResult,
);

// Authenticated users: view one result (ownership checked in controller)
router.get(
  "/:id",
  authorize("ADMIN", "FACULTY", "STUDENT"),
  getResultById,
);

// Faculty/Admin: update result
router.patch(
  "/:id",
  authorize("ADMIN", "FACULTY"),
  updateResult,
);

// Faculty/Admin: delete result
router.delete(
  "/:id",
  authorize("ADMIN", "FACULTY"),
  deleteResult,
);

export default router;
