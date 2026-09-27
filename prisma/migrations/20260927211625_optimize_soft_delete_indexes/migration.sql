-- DropIndex
DROP INDEX "Attendance_studentId_courseId_date_key";

-- DropIndex
DROP INDEX "Course_code_key";

-- CreateIndex
CREATE INDEX "Attendance_studentId_courseId_date_deletedAt_idx" ON "Attendance"("studentId", "courseId", "date", "deletedAt");

-- CreateIndex
CREATE INDEX "Course_code_idx" ON "Course"("code");

-- CreateIndex
CREATE INDEX "Enrollment_studentId_courseId_deletedAt_idx" ON "Enrollment"("studentId", "courseId", "deletedAt");

-- CreateIndex
CREATE INDEX "Result_studentId_courseId_deletedAt_idx" ON "Result"("studentId", "courseId", "deletedAt");
