import type { Request } from "express";
import type { Prisma } from "@prisma/client";
import { AuditAction } from "@prisma/client";

import { createAuditLog } from "../modules/auditLog/auditLog.service.js";

interface AuditRequestData {
  req?: Request;
  actorId?: string | null;
  action: AuditAction;
  entity: string;
  entityId?: string | null;
  description?: string | null;
  oldData?: Prisma.InputJsonValue | null;
  newData?: Prisma.InputJsonValue | null;
}

export const logActivity = async ({
  req,
  actorId,
  action,
  entity,
  entityId,
  description,
  oldData,
  newData,
}: AuditRequestData) => {
  try {
    await createAuditLog({
      actorId: actorId ?? req?.user?.userId ?? null,
      action,
      entity,
      entityId,
      description,
      oldData,
      newData,
      ipAddress:
        req?.ip ||
        req?.headers["x-forwarded-for"]?.toString().split(",")[0] ||
        null,
      userAgent: req?.headers["user-agent"] || null,
    });
  } catch (error) {
    console.error("AUDIT LOG ERROR:", error);
  }
};