-- DropIndex
DROP INDEX "Enrollment_studentId_courseId_key";

-- CreateIndex
CREATE UNIQUE INDEX "Enrollment_active_student_course_unique"
ON "Enrollment" ("studentId", "courseId")
WHERE "deletedAt" IS NULL;