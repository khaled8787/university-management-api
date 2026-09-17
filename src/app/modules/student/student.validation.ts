import { z } from "zod";

export const studentIdParamSchema = z.object({
  id: z.string().min(1, "Student ID is required"),
});

export const studentQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),

  search: z.string().trim().optional(),
  departmentId: z.string().trim().optional(),
  semester: z.coerce.number().int().min(1).optional(),

  sortBy: z
    .enum(["createdAt", "studentId", "semester", "name"])
    .default("createdAt"),

  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const updateStudentSchema = z
  .object({
    semester: z.number().int().min(1).optional(),
    phone: z.string().trim().max(20).optional(),
    dateOfBirth: z.coerce.date().optional(),
    address: z.string().trim().max(300).optional(),
    departmentId: z.string().trim().min(1).optional(),
    batch: z.string().trim().min(1).max(50).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required for update",
  });

export type StudentQueryInput = z.infer<typeof studentQuerySchema>;
export type UpdateStudentInput = z.infer<typeof updateStudentSchema>;