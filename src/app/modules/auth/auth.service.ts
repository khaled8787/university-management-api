import bcrypt from "bcrypt";
import { Prisma, UserRole } from "@prisma/client";

import prisma from "../../../config/prisma.js";
import AppError from "../../errors/AppError.js";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../../utils/jwt.js";
import type { RegisterInput, LoginInput } from "./auth.validation.js";
import { getUserById } from "../user/user.service.js";

const SALT_ROUNDS = 12;

const publicUserSelect = {
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
} satisfies Prisma.UserSelect;

const createTokens = (user: {
  id: string;
  role: UserRole;
}) => {
  const payload = {
    userId: user.id,
    role: user.role,
  };

  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
  };
};

export const registerUser = async (payload: RegisterInput) => {
  const existingUser = await prisma.user.findUnique({
    where: {
      email: payload.email,
    },
  });

  if (existingUser && !existingUser.deletedAt) {
    throw new AppError(409, "An account with this email already exists");
  }

  const hashedPassword = await bcrypt.hash(payload.password, SALT_ROUNDS);

  const result = await prisma.$transaction(async (transaction) => {
    const user = await transaction.user.create({
      data: {
        name: payload.name,
        email: payload.email,
        password: hashedPassword,
        role: payload.role,
        status: "ACTIVE",
      },
    });

    if (payload.role === "STUDENT") {
      await transaction.student.create({
        data: {
          studentId: payload.studentId as string,
          userId: user.id,
          departmentId: payload.departmentId as string,
          semester: payload.semester ?? 1,
          batch: payload.batch as string,
          phone: payload.phone,
          address: payload.address,
        },
      });
    }

    if (payload.role === "FACULTY") {
      await transaction.faculty.create({
        data: {
          employeeId: payload.employeeId as string,
          userId: user.id,
          departmentId: payload.departmentId as string,
          designation: payload.designation ?? "Lecturer",
          phone: payload.phone,
          specialization: payload.specialization,
        },
      });
    }

    return transaction.user.findUniqueOrThrow({
      where: {
        id: user.id,
      },
      select: publicUserSelect,
    });
  });

  const tokens = createTokens({
    id: result.id,
    role: result.role,
  });

  return {
    user: result,
    ...tokens,
  };
};

export const loginUser = async (payload: LoginInput) => {
  const user = await prisma.user.findUnique({
    where: {
      email: payload.email,
    },
  });

  if (!user || user.deletedAt) {
    throw new AppError(401, "Invalid email or password");
  }

  if (!user.password) {
    throw new AppError(
      401,
      "This account does not have a password. Please use social login",
    );
  }

  if (user.status !== "ACTIVE") {
    throw new AppError(403, `Your account is ${user.status.toLowerCase()}`);
  }

  const passwordMatched = await bcrypt.compare(
    payload.password,
    user.password,
  );

  if (!passwordMatched) {
    throw new AppError(401, "Invalid email or password");
  }

  const userData = await getUserById(user.id);

  if (!userData) {
    throw new AppError(404, "User profile not found");
  }

  const tokens = createTokens({
    id: user.id,
    role: user.role,
  });

  return {
    user: userData,
    ...tokens,
  };
};

export const refreshAccessToken = async (refreshToken: string) => {
  let decodedToken: ReturnType<typeof verifyRefreshToken>;

  try {
    decodedToken = verifyRefreshToken(refreshToken);
  } catch {
    throw new AppError(401, "Invalid or expired refresh token");
  }

  const user = await prisma.user.findUnique({
    where: {
      id: decodedToken.userId,
    },
    select: {
      id: true,
      role: true,
      status: true,
      deletedAt: true,
    },
  });

  if (!user || user.deletedAt) {
    throw new AppError(401, "User account not found");
  }

  if (user.status !== "ACTIVE") {
    throw new AppError(403, "Your account is not active");
  }

  return {
    accessToken: generateAccessToken({
      userId: user.id,
      role: user.role,
    }),
  };
};

export const getCurrentUser = async (userId: string) => {
  const user = await getUserById(userId);

  if (!user) {
    throw new AppError(404, "User not found");
  }

  if (user.status !== "ACTIVE") {
    throw new AppError(403, "Your account is not active");
  }

  return user;
};