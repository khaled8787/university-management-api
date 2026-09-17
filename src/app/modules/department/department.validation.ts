import { z } from "zod";

export const createDepartmentSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Department name must be at least 2 characters")
    .max(100, "Department name cannot exceed 100 characters"),

  code: z
    .string()
    .trim()
    .min(2, "Department code must be at least 2 characters")
    .max(20, "Department code cannot exceed 20 characters")
    .transform((value) => value.toUpperCase()),

  description: z
    .string()
    .trim()
    .max(500, "Description cannot exceed 500 characters")
    .optional(),
});

export const updateDepartmentSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Department name must be at least 2 characters")
      .max(100, "Department name cannot exceed 100 characters")
      .optional(),

    code: z
      .string()
      .trim()
      .min(2, "Department code must be at least 2 characters")
      .max(20, "Department code cannot exceed 20 characters")
      .transform((value) => value.toUpperCase())
      .optional(),

    description: z
      .string()
      .trim()
      .max(500, "Description cannot exceed 500 characters")
      .optional(),
  })
  .refine(
    (data) =>
      data.name !== undefined ||
      data.code !== undefined ||
      data.description !== undefined,
    {
      message: "At least one field is required for update",
    },
  );

export const departmentQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().optional(),
  sortBy: z
    .enum(["name", "code", "createdAt", "updatedAt"])
    .default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type CreateDepartmentInput = z.infer<typeof createDepartmentSchema>;
export type UpdateDepartmentInput = z.infer<typeof updateDepartmentSchema>;
export type DepartmentQueryInput = z.infer<typeof departmentQuerySchema>;