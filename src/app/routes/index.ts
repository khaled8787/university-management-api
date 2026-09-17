import { Router } from "express";

import AppError from "../errors/AppError.js";
import catchAsync from "../middlewares/catchAsync.js";
import authRoutes from "../modules/auth/auth.route.js";
import departmentRoutes from "../modules/department/department.route.js";
import studentRoutes from "../modules/student/student.route.js";
import facultyRoutes from "../modules/faculty/faculty.route.js";
import courseRoutes from "../modules/course/course.route.js";
import enrollmentRoutes from "../modules/enrollment/enrollment.route.js";
import attendanceRoutes from "../modules/attendance/attendance.route.js";
import resultRoutes from "../modules/result/result.route.js";
const router = Router();

router.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "API is healthy",
    data: {
      status: "OK",
    },
  });
});

router.get(
  "/test-error",
  catchAsync(async () => {
    throw new AppError(400, "This is a test error");
  }),
);

router.use("/auth", authRoutes);
router.use("/departments", departmentRoutes);
router.use("/students", studentRoutes);
router.use("/faculties", facultyRoutes);
router.use("/courses", courseRoutes);
router.use("/enrollments", enrollmentRoutes);
router.use("/attendances", attendanceRoutes);
router.use("/results", resultRoutes);

export default router;