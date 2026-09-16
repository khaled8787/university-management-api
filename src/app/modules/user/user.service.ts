import prisma from "../../../config/prisma";

export const getUserById = async (userId: string) => {
  return prisma.user.findUnique({
    where: {
      id: userId,
      deletedAt: null,
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      status: true,
      profileImage: true,
      googleId: true,
      createdAt: true,
      updatedAt: true,
      student: {
        select: {
          id: true,
          studentId: true,
          departmentId: true,
          semester: true,
          batch: true,
          phone: true,
          dateOfBirth: true,
          address: true,
        },
      },
      faculty: {
        select: {
          id: true,
          employeeId: true,
          departmentId: true,
          designation: true,
          phone: true,
          specialization: true,
        },
      },
    },
  });
};