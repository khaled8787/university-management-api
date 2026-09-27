import { AttendanceStatus, Prisma } from "@prisma/client";
import prisma from "../../../config/prisma.js";
import AppError from "../../errors/AppError.js";
import type {
  AttendanceQueryInput,
  CreateAttendanceInput,
  UpdateAttendanceInput,
} from "./attendance.validation.js";

const attendanceSelect = {
  id: true,
  studentId: true,
  courseId: true,
  facultyId: true,
  date: true,
  status: true,
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
} satisfies Prisma.AttendanceSelect;

const getFacultyProfile = async (userId: string) => {
  const faculty = await prisma.faculty.findFirst({
    where: {
      userId,
      deletedAt: null,
      user: {
        deletedAt: null,
      },
      department: {
        deletedAt: null,
      },
    },
    select: {
      id: true,
    },
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
    prisma.student.findFirst({
      where: {
        id: studentId,
        deletedAt: null,
        user: {
          deletedAt: null,
        },
        department: {
          deletedAt: null,
        },
      },
      select: {
        id: true,
      },
    }),

    prisma.course.findFirst({
      where: {
        id: courseId,
        deletedAt: null,
        department: {
          deletedAt: null,
        },
      },
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

  if (course.facultyId) {
    const faculty = await prisma.faculty.findFirst({
      where: {
        id: course.facultyId,
        deletedAt: null,
        user: {
          deletedAt: null,
        },
        department: {
          deletedAt: null,
        },
      },
      select: {
        id: true,
      },
    });

    if (!faculty) {
      throw new AppError(
        400,
        "The faculty assigned to this course is no longer active",
      );
    }
  }

  return course;
};

const createAttendance = async (
  userId: string,
  role: string,
  payload: CreateAttendanceInput,
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
        "You can manage attendance only for your assigned courses",
      );
    }

    facultyId = faculty.id;
  }

  const attendanceDate = new Date(payload.date);
attendanceDate.setHours(0, 0, 0, 0);

  const existingAttendance = await prisma.attendance.findFirst({
    where: {
      studentId: payload.studentId,
      courseId: payload.courseId,
      date: attendanceDate,
      deletedAt: null,
    },
  });

  if (existingAttendance) {
    throw new AppError(
      409,
      "Attendance already exists for this student on this date",
    );
  }

  return prisma.attendance.create({
    data: {
      studentId: payload.studentId,
      courseId: payload.courseId,
      facultyId,
      date: attendanceDate,
      status: payload.status as AttendanceStatus,
      remarks: payload.remarks,
    },
    select: attendanceSelect,
  });
};

const getAttendances = async (query: AttendanceQueryInput) => {
  const {
    page,
    limit,
    studentId,
    courseId,
    facultyId,
    status,
    date,
    sortOrder,
  } = query;

  const where: Prisma.AttendanceWhereInput = {
    deletedAt: null,

    ...(studentId && {
      studentId,
    }),

    ...(courseId && {
      courseId,
    }),

    ...(facultyId && {
      facultyId,
    }),

    ...(status && {
      status,
    }),

    ...(date && {
      date: {
  gte: new Date(new Date(date).setHours(0, 0, 0, 0)),
  lt: new Date(new Date(date).setHours(23, 59, 59, 999)),
},
    }),

    student: {
      deletedAt: null,
      user: {
        deletedAt: null,
      },
      department: {
        deletedAt: null,
      },
    },

    course: {
      deletedAt: null,
      department: {
        deletedAt: null,
      },
    },

    faculty: {
      deletedAt: null,
      user: {
        deletedAt: null,
      },
      department: {
        deletedAt: null,
      },
    },
  };

  const [total, data] = await prisma.$transaction([
    prisma.attendance.count({
      where,
    }),

    prisma.attendance.findMany({
      where,
      select: attendanceSelect,
      orderBy: {
        date: sortOrder,
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

const getAttendanceById = async (id: string) => {
  const attendance = await prisma.attendance.findFirst({
    where: {
      id,
      deletedAt: null,

      student: {
        deletedAt: null,
        user: {
          deletedAt: null,
        },
        department: {
          deletedAt: null,
        },
      },

      course: {
        deletedAt: null,
        department: {
          deletedAt: null,
        },
      },

      faculty: {
        deletedAt: null,
        user: {
          deletedAt: null,
        },
        department: {
          deletedAt: null,
        },
      },
    },
    select: attendanceSelect,
  });

  if (!attendance) {
    throw new AppError(404, "Attendance record not found");
  }

  return attendance;
};

const getMyAttendances = async (
  userId: string,
  query: AttendanceQueryInput,
) => {
  const student = await prisma.student.findFirst({
    where: {
      userId,
      deletedAt: null,
      user: {
        deletedAt: null,
      },
      department: {
        deletedAt: null,
      },
    },
    select: {
      id: true,
    },
  });

  if (!student) {
    throw new AppError(404, "Student profile not found");
  }

  return getAttendances({
    ...query,
    studentId: student.id,
  });
};

const updateAttendance = async (
  userId: string,
  role: string,
  id: string,
  payload: UpdateAttendanceInput,
) => {
  const attendance = await prisma.attendance.findFirst({
    where: {
      id,
      deletedAt: null,

      student: {
        deletedAt: null,
        user: {
          deletedAt: null,
        },
        department: {
          deletedAt: null,
        },
      },

      course: {
        deletedAt: null,
        department: {
          deletedAt: null,
        },
      },

      faculty: {
        deletedAt: null,
        user: {
          deletedAt: null,
        },
        department: {
          deletedAt: null,
        },
      },
    },
    include: {
      course: {
        select: {
          facultyId: true,
        },
      },
    },
  });

  if (!attendance) {
    throw new AppError(404, "Attendance record not found");
  }

  if (role !== "ADMIN") {
    const faculty = await getFacultyProfile(userId);

    if (
      attendance.facultyId !== faculty.id ||
      attendance.course.facultyId !== faculty.id
    ) {
      throw new AppError(
        403,
        "You can update only your assigned course attendance",
      );
    }
  }

  return prisma.attendance.update({
    where: {
      id,
    },
    data: {
      ...(payload.status && {
        status: payload.status as AttendanceStatus,
      }),

      ...(payload.remarks !== undefined && {
        remarks: payload.remarks,
      }),
    },
    select: attendanceSelect,
  });
};

const deleteAttendance = async (
  userId: string,
  role: string,
  id: string,
) => {
  const attendance = await prisma.attendance.findFirst({
    where: {
      id,
      deletedAt: null,

      student: {
        deletedAt: null,
        user: {
          deletedAt: null,
        },
        department: {
          deletedAt: null,
        },
      },

      course: {
        deletedAt: null,
        department: {
          deletedAt: null,
        },
      },

      faculty: {
        deletedAt: null,
        user: {
          deletedAt: null,
        },
        department: {
          deletedAt: null,
        },
      },
    },
    select: {
      id: true,
      facultyId: true,
    },
  });

  if (!attendance) {
    throw new AppError(404, "Attendance record not found");
  }

  if (role !== "ADMIN") {
    const faculty = await getFacultyProfile(userId);

    if (attendance.facultyId !== faculty.id) {
      throw new AppError(
        403,
        "You can delete only your own course attendance",
      );
    }
  }

  const deletedAt = new Date();

  return prisma.attendance.update({
    where: {
      id,
    },
    data: {
      deletedAt,
    },
    select: {
      id: true,
      deletedAt: true,
    },
  });
};

export const attendanceService = {
  createAttendance,
  getAttendances,
  getAttendanceById,
  getMyAttendances,
  updateAttendance,
  deleteAttendance,
};