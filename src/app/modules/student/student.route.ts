import { Router } from "express";

import {
authenticate,
authorize,
} from "../../middlewares/auth.js";

import { studentController } from "./student.controller.js";

const router = Router();

router.use(authenticate);

// Faculty: students enrolled in their assigned courses.
router.get(
"/my-courses",
authorize("FACULTY"),
studentController.getMyCourseStudents,
);

// Admin-only student management — unchanged.
router.get(
"/",
authorize("ADMIN"),
studentController.getAllStudents,
);

router.get(
"/:id",
authorize("ADMIN"),
studentController.getStudentById,
);

router.patch(
"/:id",
authorize("ADMIN"),
studentController.updateStudent,
);

router.delete(
"/:id",
authorize("ADMIN"),
studentController.deleteStudent,
);

export default router;
