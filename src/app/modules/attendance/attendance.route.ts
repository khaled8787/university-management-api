import { Router } from "express";
import { authenticate, authorize } from "../../middlewares/auth.js";
import {
  createAttendance,
  deleteAttendance,
  getAttendanceById,
  getAttendances,
  getMyAttendances,
  updateAttendance,
} from "./attendance.controller.js";

const router = Router();

router.use(authenticate);

// Student: own attendance
router.get(
  "/my",
  authorize("STUDENT"),
  getMyAttendances,
);

// Admin: all attendance records
router.get(
  "/",
  authorize("ADMIN"),
  getAttendances,
);

// Faculty/Admin: create attendance
router.post(
  "/",
  authorize("ADMIN", "FACULTY"),
  createAttendance,
);

// Any authenticated role: view one record
router.get(
  "/:id",
  authorize("ADMIN", "FACULTY", "STUDENT"),
  getAttendanceById,
);

// Faculty/Admin: update attendance
router.patch(
  "/:id",
  authorize("ADMIN", "FACULTY"),
  updateAttendance,
);

// Faculty/Admin: delete attendance
router.delete(
  "/:id",
  authorize("ADMIN", "FACULTY"),
  deleteAttendance,
);

export default router;