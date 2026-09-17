import { Router } from "express";

import { authenticate, authorize } from "../../middlewares/auth.js";
import { studentController } from "./student.controller.js";

const router = Router();

// All routes require authentication
router.use(authenticate);

// Admin can view all students
router.get(
  "/",
  authorize("ADMIN"),
  studentController.getAllStudents,
);

// Admin can view a specific student
router.get(
  "/:id",
  authorize("ADMIN"),
  studentController.getStudentById,
);

// Only Admin can update student profiles
router.patch(
  "/:id",
  authorize("ADMIN"),
  studentController.updateStudent,
);

// Only Admin can soft-delete students
router.delete(
  "/:id",
  authorize("ADMIN"),
  studentController.deleteStudent,
);

export default router;