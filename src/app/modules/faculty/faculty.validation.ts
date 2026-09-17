import { z } from "zod";

export const facultyIdParamSchema = z.object({
  id: z.string().min(1, "Faculty ID is required"),
});

export const facultyQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),

  limit: z.coerce.number().int().min(1).max(100).default(10),

  search: z.string().trim().optional(),

  departmentId: z.string().trim().optional(),

  designation: z.string().trim().optional(),

  specialization: z.string().trim().optional(),

  sortBy: z
    .enum(["createdAt", "employeeId", "designation", "name"])
    .default("createdAt"),

  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const updateFacultySchema = z
  .object({
    departmentId: z.string().trim().min(1).optional(),

    designation: z.string().trim().min(2).max(100).optional(),

    phone: z.string().trim().max(20).optional(),

    specialization: z.string().trim().max(200).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required for update",
  });

export type FacultyQueryInput = z.infer<typeof facultyQuerySchema>;

export type UpdateFacultyInput = z.infer<
  typeof updateFacultySchema
>;