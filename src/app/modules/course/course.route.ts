import { Router } from "express";

import {
authenticate,
authorize,
} from "../../middlewares/auth.js";

import { courseController } from "./course.controller.js";

const router = Router();

router.use(authenticate);

// Faculty: only courses assigned to the logged-in faculty.
// Keep this route before "/:id".
router.get(
"/my",
authorize("FACULTY"),
courseController.getMyCourses,
);

// General course listing — existing permissions preserved.
router.get(
"/",
authorize("ADMIN", "FACULTY", "STUDENT"),
courseController.getAllCourses,
);

// Single course details.
router.get(
"/:id",
authorize("ADMIN", "FACULTY", "STUDENT"),
courseController.getCourseById,
);

// Admin-only management.
router.post(
"/",
authorize("ADMIN"),
courseController.createCourse,
);

router.patch(
"/:id",
authorize("ADMIN"),
courseController.updateCourse,
);

router.patch(
"/:id/status",
authorize("ADMIN"),
courseController.updateCourseStatus,
);

router.delete(
"/:id",
authorize("ADMIN"),
courseController.deleteCourse,
);

export default router;
