import { z } from "zod";

export const registerValidationSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Name must be at least 2 characters")
      .max(100, "Name cannot exceed 100 characters"),

    email: z
      .string()
      .trim()
      .email("Please provide a valid email address")
      .toLowerCase(),

    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(100, "Password cannot exceed 100 characters"),

    role: z.enum(["STUDENT", "FACULTY"], {
      message: "Role must be either STUDENT or FACULTY",
    }),

    studentId: z.string().trim().optional(),

    employeeId: z.string().trim().optional(),

    departmentId: z.string().trim().optional(),

    semester: z.number().int().min(1).max(20).optional(),

    batch: z
  .string()
  .trim()
  .min(1, "Batch is required for student registration")
  .max(50, "Batch cannot exceed 50 characters")
  .optional(),

    phone: z.string().trim().max(20).optional(),

    address: z.string().trim().max(300).optional(),

    designation: z.string().trim().max(100).optional(),

    specialization: z.string().trim().max(200).optional(),
  })
  .superRefine((data, context) => {
    if (data.role === "STUDENT" && !data.batch) {
  context.addIssue({
    code: "custom",
    path: ["batch"],
    message: "Batch is required for student registration",
  });
}

    if (data.role === "FACULTY" && !data.employeeId) {
      context.addIssue({
        code: "custom",
        path: ["employeeId"],
        message: "employeeId is required for faculty registration",
      });
    }

    if (!data.departmentId) {
      context.addIssue({
        code: "custom",
        path: ["departmentId"],
        message: "departmentId is required",
      });
    }
  });

export const loginValidationSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Please provide a valid email address")
    .toLowerCase(),

  password: z.string().min(1, "Password is required"),
});

export const refreshTokenValidationSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

export type RegisterInput = z.infer<typeof registerValidationSchema>;
export type LoginInput = z.infer<typeof loginValidationSchema>;

export const googleLoginValidationSchema = z.object({
  idToken: z.string().min(1, "Firebase ID token is required"),

  role: z
    .enum(["STUDENT", "FACULTY"])
    .optional(),

  studentId: z.string().trim().optional(),

  employeeId: z.string().trim().optional(),

  departmentId: z.string().trim().optional(),

  semester: z
    .number()
    .int()
    .min(1)
    .max(20)
    .optional(),

  batch: z
    .string()
    .trim()
    .max(50)
    .optional(),

  phone: z
    .string()
    .trim()
    .max(20)
    .optional(),

  address: z
    .string()
    .trim()
    .max(300)
    .optional(),

  designation: z
    .string()
    .trim()
    .max(100)
    .optional(),

  specialization: z
    .string()
    .trim()
    .max(200)
    .optional(),
});

export type GoogleLoginInput = z.infer<
  typeof googleLoginValidationSchema
>;