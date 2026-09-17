import { z } from "zod";

export const resultIdSchema = z.object({
  id: z.string().cuid("Invalid result ID"),
});

export const createResultSchema = z.object({
  studentId: z.string().cuid("Invalid student ID"),
  courseId: z.string().cuid("Invalid course ID"),
  marks: z.coerce.number().min(0).max(100),
  remarks: z.string().max(500).optional(),
});

export const updateResultSchema = z.object({
  marks: z.coerce.number().min(0).max(100).optional(),
  remarks: z.string().max(500).optional(),
});

export const resultQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  studentId: z.string().cuid().optional(),
  courseId: z.string().cuid().optional(),
  facultyId: z.string().cuid().optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type CreateResultInput = z.infer<typeof createResultSchema>;
export type UpdateResultInput = z.infer<typeof updateResultSchema>;
export type ResultQueryInput = z.infer<typeof resultQuerySchema>;