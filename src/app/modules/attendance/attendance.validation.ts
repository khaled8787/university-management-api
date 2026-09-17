import { z } from "zod";

export const attendanceIdSchema = z.object({
  id: z.string().cuid("Invalid attendance ID"),
});

export const createAttendanceSchema = z.object({
  studentId: z.string().cuid("Invalid student ID"),
  courseId: z.string().cuid("Invalid course ID"),
  date: z.coerce.date(),
  status: z.enum(["PRESENT", "ABSENT", "LATE", "EXCUSED"]),
  remarks: z.string().max(500).optional(),
});

export const updateAttendanceSchema = z.object({
  status: z.enum(["PRESENT", "ABSENT", "LATE", "EXCUSED"]).optional(),
  remarks: z.string().max(500).optional(),
});

export const attendanceQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  studentId: z.string().cuid().optional(),
  courseId: z.string().cuid().optional(),
  facultyId: z.string().cuid().optional(),
  status: z.enum(["PRESENT", "ABSENT", "LATE", "EXCUSED"]).optional(),
  date: z.coerce.date().optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type CreateAttendanceInput = z.infer<
  typeof createAttendanceSchema
>;

export type UpdateAttendanceInput = z.infer<
  typeof updateAttendanceSchema
>;

export type AttendanceQueryInput = z.infer<
  typeof attendanceQuerySchema
>;