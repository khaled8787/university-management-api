import { Router } from "express";

import { authenticate, authorize } from "../../middlewares/auth.js";
import { departmentController } from "./department.controller.js";

const router = Router();

router.use(authenticate);

// সকল authenticated user department দেখতে পারবে
router.get("/", departmentController.getAllDepartments);

router.get("/:id", departmentController.getDepartmentById);

// শুধু ADMIN department তৈরি করতে পারবে
router.post(
  "/",
  authorize("ADMIN"),
  departmentController.createDepartment,
);

// শুধু ADMIN update করতে পারবে
router.patch(
  "/:id",
  authorize("ADMIN"),
  departmentController.updateDepartment,
);

// শুধু ADMIN soft delete করতে পারবে
router.delete(
  "/:id",
  authorize("ADMIN"),
  departmentController.deleteDepartment,
);

export default router;