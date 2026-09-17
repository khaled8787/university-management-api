import { Prisma } from "@prisma/client";
import prisma from "../../../config/prisma.js";
import AppError from "../../errors/AppError.js";
import type {
  CreateResultInput,
  ResultQueryInput,
  UpdateResultInput,
} from "./result.validation.js";

const resultSelect = {
  id: true,
  studentId: true,
  courseId: true,
  facultyId: true,
  marks: true,
  grade: true,
  gradePoint: true,
  remarks: true,
  createdAt: true,
  updatedAt: true,
  student: {
    select: {
      id: true,
      studentId: true,
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  },
  course: {
    select: {
      id: true,
      code: true,
      title: true,
      credit: true,
    },
  },
  faculty: {
    select: {
      id: true,
      employeeId: true,
      user: {
        select: {
          name: true,
        },
      },
    },
  },
} satisfies Prisma.ResultSelect;

const calculateGrade = (marks: number) => {
  if (marks >= 80) return { grade: "A_PLUS", gradePoint: 4.0 };
  if (marks >= 75) return { grade: "A", gradePoint: 3.75 };
  if (marks >= 70) return { grade: "A_MINUS", gradePoint: 3.5 };
  if (marks >= 65) return { grade: "B_PLUS", gradePoint: 3.25 };
  if (marks >= 60) return { grade: "B", gradePoint: 3.0 };
  if (marks >= 55) return { grade: "B_MINUS", gradePoint: 2.75 };
  if (marks >= 50) return { grade: "C_PLUS", gradePoint: 2.5 };
  if (marks >= 45) return { grade: "C", gradePoint: 2.25 };
  if (marks >= 40) return { grade: "D", gradePoint: 2.0 };

  return { grade: "F", gradePoint: 0.0 };
};

const getFacultyProfile = async (userId: string) => {
  const faculty = await prisma.faculty.findUnique({
    where: { userId },
    select: { id: true },
  });

  if (!faculty) {
    throw new AppError(404, "Faculty profile not found");
  }

  return faculty;
};

const verifyStudentAndCourse = async (
  studentId: string,
  courseId: string,
) => {
  const [student, course] = await Promise.all([
    prisma.student.findUnique({
      where: { id: studentId },
      select: { id: true },
    }),
    prisma.course.findUnique({
      where: { id: courseId },
      select: {
        id: true,
        facultyId: true,
        isActive: true,
      },
    }),
  ]);

  if (!student) {
    throw new AppError(404, "Student not found");
  }

  if (!course) {
    throw new AppError(404, "Course not found");
  }

  if (!course.isActive) {
    throw new AppError(400, "This course is inactive");
  }

  return course;
};

const createResult = async (
  userId: string,
  role: string,
  payload: CreateResultInput,
) => {
  const course = await verifyStudentAndCourse(
    payload.studentId,
    payload.courseId,
  );

  let facultyId: string;

  if (role === "ADMIN") {
    if (!course.facultyId) {
      throw new AppError(400, "No faculty is assigned to this course");
    }

    facultyId = course.facultyId;
  } else {
    const faculty = await getFacultyProfile(userId);

    if (course.facultyId !== faculty.id) {
      throw new AppError(
        403,
        "You can manage results only for your assigned courses",
      );
    }

    facultyId = faculty.id;
  }

  const existingResult = await prisma.result.findUnique({
    where: {
      studentId_courseId: {
        studentId: payload.studentId,
        courseId: payload.courseId,
      },
    },
  });

  if (existingResult) {
    throw new AppError(
      409,
      "Result already exists for this student in this course",
    );
  }

  const grading = calculateGrade(payload.marks);

  return prisma.result.create({
    data: {
      studentId: payload.studentId,
      courseId: payload.courseId,
      facultyId,
      marks: payload.marks,
      grade: grading.grade as never,
      gradePoint: grading.gradePoint,
      remarks: payload.remarks,
    },
    select: resultSelect,
  });
};

const getResults = async (query: ResultQueryInput) => {
  const {
    page,
    limit,
    studentId,
    courseId,
    facultyId,
    sortOrder,
  } = query;

  const where: Prisma.ResultWhereInput = {
    ...(studentId && { studentId }),
    ...(courseId && { courseId }),
    ...(facultyId && { facultyId }),
  };

  const [total, data] = await prisma.$transaction([
    prisma.result.count({ where }),
    prisma.result.findMany({
      where,
      select: resultSelect,
      orderBy: {
        createdAt: sortOrder,
      },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return {
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    data,
  };
};

const getMyResults = async (
  userId: string,
  query: ResultQueryInput,
) => {
  const student = await prisma.student.findUnique({
    where: { userId },
    select: { id: true },
  });

  if (!student) {
    throw new AppError(404, "Student profile not found");
  }

  return getResults({
    ...query,
    studentId: student.id,
  });
};

const getResultById = async (id: string) => {
  const result = await prisma.result.findUnique({
    where: { id },
    select: resultSelect,
  });

  if (!result) {
    throw new AppError(404, "Result not found");
  }

  return result;
};

const updateResult = async (
  userId: string,
  role: string,
  id: string,
  payload: UpdateResultInput,
) => {
  const existingResult = await prisma.result.findUnique({
    where: { id },
    include: {
      course: {
        select: {
          facultyId: true,
        },
      },
    },
  });

  if (!existingResult) {
    throw new AppError(404, "Result not found");
  }

  if (role !== "ADMIN") {
    const faculty = await getFacultyProfile(userId);

    if (
      existingResult.facultyId !== faculty.id ||
      existingResult.course.facultyId !== faculty.id
    ) {
      throw new AppError(
        403,
        "You can update only results of your assigned courses",
      );
    }
  }

  const grading =
    payload.marks !== undefined
      ? calculateGrade(payload.marks)
      : {
          grade: existingResult.grade,
          gradePoint: existingResult.gradePoint,
        };

  return prisma.result.update({
    where: { id },
    data: {
      ...(payload.marks !== undefined && {
        marks: payload.marks,
        grade: grading.grade as never,
        gradePoint: grading.gradePoint,
      }),
      ...(payload.remarks !== undefined && {
        remarks: payload.remarks,
      }),
    },
    select: resultSelect,
  });
};

const deleteResult = async (
  userId: string,
  role: string,
  id: string,
) => {
  const existingResult = await prisma.result.findUnique({
    where: { id },
    select: {
      id: true,
      facultyId: true,
    },
  });

  if (!existingResult) {
    throw new AppError(404, "Result not found");
  }

  if (role !== "ADMIN") {
    const faculty = await getFacultyProfile(userId);

    if (existingResult.facultyId !== faculty.id) {
      throw new AppError(
        403,
        "You can delete only your own course results",
      );
    }
  }

  await prisma.result.delete({
    where: { id },
  });
};

export const resultService = {
  createResult,
  getResults,
  getMyResults,
  getResultById,
  updateResult,
  deleteResult,
};