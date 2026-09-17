import { Router } from "express";

import {
  authenticate,
  authorize,
} from "../../middlewares/auth.js";

import { facultyController } from "./faculty.controller.js";

const router = Router();

router.use(authenticate);

router.get(
  "/",
  authorize("ADMIN"),
  facultyController.getAllFaculties,
);

router.get(
  "/:id",
  authorize("ADMIN"),
  facultyController.getFacultyById,
);

router.patch(
  "/:id",
  authorize("ADMIN"),
  facultyController.updateFaculty,
);

router.delete(
  "/:id",
  authorize("ADMIN"),
  facultyController.deleteFaculty,
);

export default router;