import type {
NextFunction,
Request,
Response,
} from "express";
import { AuditAction } from "@prisma/client";
import { StatusCodes } from "http-status-codes";

import sendResponse from "../../utils/sendResponse.js";
import { logActivity } from "../../utils/auditLog.js";
import { studentService } from "./student.service.js";
import {
studentIdParamSchema,
studentQuerySchema,
updateStudentSchema,
} from "./student.validation.js";

// ============================================================
// GET ALL STUDENTS — ADMIN
// ============================================================

const getAllStudents = async (
req: Request,
res: Response,
next: NextFunction,
): Promise<Response | void> => {
try {
const query = studentQuerySchema.parse(req.query);


const result = await studentService.getAllStudents(query);

return sendResponse(res, {
  statusCode: StatusCodes.OK,
  success: true,
  message: "Students retrieved successfully",
  data: result,
});


} catch (error) {
return next(error);
}
};

// ============================================================
// GET FACULTY'S COURSE STUDENTS
// ============================================================

const getMyCourseStudents = async (
req: Request,
res: Response,
next: NextFunction,
): Promise<Response | void> => {
try {
if (!req.user?.userId) {
throw new Error("Authenticated user information is missing");
}


const query = studentQuerySchema.parse(req.query);

const result = await studentService.getFacultyStudents(
  req.user.userId,
  query,
);

return sendResponse(res, {
  statusCode: StatusCodes.OK,
  success: true,
  message: "Faculty course students retrieved successfully",
  data: result,
});


} catch (error) {
return next(error);
}
};

// ============================================================
// GET SINGLE STUDENT
// ============================================================

const getStudentById = async (
req: Request<{ id: string }>,
res: Response,
next: NextFunction,
): Promise<Response | void> => {
try {
const { id } = studentIdParamSchema.parse(req.params);


const result = await studentService.getStudentById(id);

return sendResponse(res, {
  statusCode: StatusCodes.OK,
  success: true,
  message: "Student retrieved successfully",
  data: result,
});


} catch (error) {
return next(error);
}
};

// ============================================================
// UPDATE STUDENT — ADMIN
// ============================================================

const updateStudent = async (
req: Request<{ id: string }>,
res: Response,
next: NextFunction,
): Promise<Response | void> => {
try {
const { id } = studentIdParamSchema.parse(req.params);
const payload = updateStudentSchema.parse(req.body);


const oldStudent = await studentService.getStudentById(id);

const result = await studentService.updateStudent(id, payload);

await logActivity({
  req,
  actorId: req.user?.userId,
  action: AuditAction.UPDATE,
  entity: "Student",
  entityId: id,
  description: "Student information updated",

  oldData: {
    studentId: oldStudent.studentId,
    semester: oldStudent.semester,
    batch: oldStudent.batch,
    phone: oldStudent.phone,
    dateOfBirth: oldStudent.dateOfBirth?.toISOString() ?? null,
    address: oldStudent.address,

    department: {
      id: oldStudent.department.id,
      name: oldStudent.department.name,
      code: oldStudent.department.code,
    },

    user: {
      id: oldStudent.user.id,
      name: oldStudent.user.name,
      email: oldStudent.user.email,
      status: oldStudent.user.status,
    },
  },

  newData: {
    studentId: result.studentId,
    semester: result.semester,
    batch: result.batch,
    phone: result.phone,
    dateOfBirth: result.dateOfBirth?.toISOString() ?? null,
    address: result.address,

    department: {
      id: result.department.id,
      name: result.department.name,
      code: result.department.code,
    },

    user: {
      id: result.user.id,
      name: result.user.name,
      email: result.user.email,
      status: result.user.status,
    },
  },
});

return sendResponse(res, {
  statusCode: StatusCodes.OK,
  success: true,
  message: "Student updated successfully",
  data: result,
});


} catch (error) {
return next(error);
}
};

// ============================================================
// DELETE STUDENT — ADMIN
// ============================================================

const deleteStudent = async (
req: Request<{ id: string }>,
res: Response,
next: NextFunction,
): Promise<Response | void> => {
try {
const { id } = studentIdParamSchema.parse(req.params);


const student = await studentService.getStudentById(id);
const deletion = await studentService.deleteStudent(id);

await logActivity({
  req,
  actorId: req.user?.userId,
  action: AuditAction.DELETE,
  entity: "Student",
  entityId: id,
  description: "Student account soft deleted",

  oldData: {
    studentId: student.studentId,

    user: {
      id: student.user.id,
      name: student.user.name,
      email: student.user.email,
      status: student.user.status,
    },

    department: {
      id: student.department.id,
      name: student.department.name,
      code: student.department.code,
    },

    semester: student.semester,
    batch: student.batch,
  },

  newData: {
    deleted: true,
    deletedAt: deletion.deletedAt.toISOString(),
  },
});

return sendResponse(res, {
  statusCode: StatusCodes.OK,
  success: true,
  message: "Student deleted successfully",
  data: null,
});


} catch (error) {
return next(error);
}
};

// ============================================================
// EXPORT
// ============================================================

export const studentController = {
getAllStudents,
getMyCourseStudents,
getStudentById,
updateStudent,
deleteStudent,
};
