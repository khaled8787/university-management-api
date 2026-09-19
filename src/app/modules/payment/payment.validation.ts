import { z } from "zod";

const paymentTypes = [
  "TUITION_FEE",
  "COURSE_FEE",
  "SEMESTER_FEE",
  "OTHER",
] as const;

const paymentMethods = ["STRIPE", "BKASH", "SSLCOMMERZ"] as const;

const paymentStatuses = [
  "PENDING",
  "PAID",
  "FAILED",
  "CANCELLED",
  "REFUNDED",
] as const;

export const createPaymentSchema = z.object({
  amount: z.coerce
    .number()
    .positive("Amount must be greater than zero")
    .max(10000000, "Amount is too large"),

  type: z.enum(paymentTypes),

  method: z.enum(paymentMethods),

  currency: z
    .string()
    .trim()
    .length(3, "Currency must contain exactly 3 characters")
    .transform((value) => value.toUpperCase())
    .default("BDT"),
});

export const paymentIdParamSchema = z.object({
  id: z.string().min(1, "Payment ID is required"),
});

export const paymentQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),

  status: z.enum(paymentStatuses).optional(),
  type: z.enum(paymentTypes).optional(),
  method: z.enum(paymentMethods).optional(),
  studentId: z.string().optional(),

  sortBy: z
    .enum(["createdAt", "amount", "paidAt", "status"])
    .default("createdAt"),

  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type PaymentQueryInput = z.infer<typeof paymentQuerySchema>;