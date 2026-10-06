import { Router } from "express";

import { authenticate, authorize } from "../../middlewares/auth.js";

import { departmentController } from "./department.controller.js";

const router = Router();

// Public department routes
router.get("/", departmentController.getAllDepartments);

router.get(
  "/:id",
  departmentController.getDepartmentById,
);

// Admin-only department management
router.post(
  "/",
  authenticate,
  authorize("ADMIN"),
  departmentController.createDepartment,
);

router.patch(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  departmentController.updateDepartment,
);

router.delete(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  departmentController.deleteDepartment,
);

export default router;