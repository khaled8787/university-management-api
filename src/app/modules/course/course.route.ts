import { Router } from "express";

import {
  authenticate,
  authorize,
} from "../../middlewares/auth.js";

import { courseController } from "./course.controller.js";

const router = Router();

router.use(authenticate);

// Course listing: Admin, Faculty and Student
router.get(
  "/",
  authorize("ADMIN", "FACULTY", "STUDENT"),
  courseController.getAllCourses,
);

// Single course details: Admin, Faculty and Student
router.get(
  "/:id",
  authorize("ADMIN", "FACULTY", "STUDENT"),
  courseController.getCourseById,
);

// Course creation: Admin only
router.post(
  "/",
  authorize("ADMIN"),
  courseController.createCourse,
);

// Course update: Admin only
router.patch(
  "/:id",
  authorize("ADMIN"),
  courseController.updateCourse,
);

// Activate/deactivate course: Admin only
router.patch(
  "/:id/status",
  authorize("ADMIN"),
  courseController.updateCourseStatus,
);

// Soft delete: Admin only
router.delete(
  "/:id",
  authorize("ADMIN"),
  courseController.deleteCourse,
);

export default router;