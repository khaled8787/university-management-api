DROP INDEX "Result_studentId_courseId_key";

CREATE UNIQUE INDEX "Result_active_student_course_unique"
ON "Result" ("studentId", "courseId")
WHERE "deletedAt" IS NULL;