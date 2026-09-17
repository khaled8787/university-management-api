import { z } from "zod";

export const courseIdParamSchema = z.object({
  id: z.string().min(1, "Course ID is required"),
});

export const createCourseSchema = z.object({
  code: z
    .string()
    .trim()
    .min(2)
    .max(20)
    .transform((value) => value.toUpperCase()),

  title: z.string().trim().min(2).max(150),

  description: z.string().trim().max(1000).optional(),

  credit: z.number().positive().max(20),

  departmentId: z.string().trim().min(1),

  facultyId: z.string().trim().min(1).optional(),

  semester: z.number().int().min(1).max(20),

  capacity: z.number().int().min(1).max(1000).default(30),
});

export const updateCourseSchema = z
  .object({
    code: z
      .string()
      .trim()
      .min(2)
      .max(20)
      .transform((value) => value.toUpperCase())
      .optional(),

    title: z.string().trim().min(2).max(150).optional(),

    description: z.string().trim().max(1000).nullable().optional(),

    credit: z.number().positive().max(20).optional(),

    departmentId: z.string().trim().min(1).optional(),

    facultyId: z.string().trim().min(1).nullable().optional(),

    semester: z.number().int().min(1).max(20).optional(),

    capacity: z.number().int().min(1).max(1000).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required for update",
  });

export const courseQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),

  limit: z.coerce.number().int().min(1).max(100).default(10),

  search: z.string().trim().optional(),

  departmentId: z.string().trim().optional(),

  facultyId: z.string().trim().optional(),

  semester: z.coerce.number().int().min(1).optional(),

  isActive: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .optional(),

  sortBy: z
    .enum(["createdAt", "code", "title", "credit", "semester"])
    .default("createdAt"),

  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type CreateCourseInput = z.infer<typeof createCourseSchema>;
export type UpdateCourseInput = z.infer<typeof updateCourseSchema>;
export type CourseQueryInput = z.infer<typeof courseQuerySchema>;