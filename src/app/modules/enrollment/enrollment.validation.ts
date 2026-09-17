import { z } from "zod";

export const enrollmentIdParamSchema = z.object({
  id: z.string().min(1, "Enrollment ID is required"),
});

export const createEnrollmentSchema = z.object({
  courseId: z.string().trim().min(1, "Course ID is required"),
});

export const enrollmentQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),

  limit: z.coerce.number().int().min(1).max(100).default(10),

  status: z
    .enum(["PENDING", "APPROVED", "REJECTED", "CANCELLED"])
    .optional(),

  courseId: z.string().trim().optional(),

  studentId: z.string().trim().optional(),

  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const updateEnrollmentStatusSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
});

export type CreateEnrollmentInput = z.infer<
  typeof createEnrollmentSchema
>;

export type EnrollmentQueryInput = z.infer<
  typeof enrollmentQuerySchema
>;

export type UpdateEnrollmentStatusInput = z.infer<
  typeof updateEnrollmentStatusSchema
>;