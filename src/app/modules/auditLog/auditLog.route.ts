import { Router } from "express";

import { authenticate, authorize } from "../../middlewares/auth.js";
import {
  getAllAuditLogs,
  getSingleAuditLog,
} from "./auditLog.controller.js";

const router = Router();

router.use(authenticate);
router.use(authorize("ADMIN"));

router.get("/", getAllAuditLogs);
router.get("/:id", getSingleAuditLog);

export default router;