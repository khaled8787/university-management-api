import { z } from "zod";

export const auditLogQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),

  action: z
    .enum([
      "CREATE",
      "UPDATE",
      "DELETE",
      "LOGIN",
      "LOGOUT",
      "ROLE_CHANGE",
      "STATUS_CHANGE",
      "PAYMENT",
      "ENROLLMENT",
    ])
    .optional(),

  entity: z.string().trim().min(1).optional(),

  actorId: z.string().trim().min(1).optional(),

  search: z.string().trim().min(1).optional(),

  sortOrder: z.enum(["asc", "desc"]).optional(),
});

export const auditLogIdSchema = z.object({
  id: z.string().trim().min(1),
});