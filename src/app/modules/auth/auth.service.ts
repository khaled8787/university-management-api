import bcrypt from "bcrypt";
import { AuditAction, Prisma, UserRole } from "@prisma/client";

import { firebaseAuth } from "../../../config/firebase.js";
import prisma from "../../../config/prisma.js";
import AppError from "../../errors/AppError.js";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../../utils/jwt.js";
import { logActivity } from "../../utils/auditLog.js";
import { getUserById } from "../user/user.service.js";
import type {
  RegisterInput,
  LoginInput,
  GoogleLoginInput,
} from "./auth.validation.js";

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

// ============================================================
// REGISTER
// ============================================================

export const registerUser = async (payload: RegisterInput) => {
  const existingUser = await prisma.user.findUnique({
    where: {
      email: payload.email,
    },
  });

  if (existingUser && !existingUser.deletedAt) {
    throw new AppError(
      409,
      "An account with this email already exists",
    );
  }

  const hashedPassword = await bcrypt.hash(
    payload.password,
    SALT_ROUNDS,
  );

  const result = await prisma.$transaction(
    async (transaction) => {
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
    },
  );

  // Audit log: account creation
  await logActivity({
    action: AuditAction.CREATE,
    entity: "User",
    entityId: result.id,
    description: `New ${result.role.toLowerCase()} account created`,
    newData: {
      email: result.email,
      name: result.name,
      role: result.role,
    },
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

// ============================================================
// PASSWORD LOGIN
// ============================================================

export const loginUser = async (payload: LoginInput) => {
  const user = await prisma.user.findUnique({
    where: {
      email: payload.email,
    },
  });

  if (!user || user.deletedAt) {
    throw new AppError(
      401,
      "Invalid email or password",
    );
  }

  if (!user.password) {
    throw new AppError(
      401,
      "This account does not have a password. Please use social login",
    );
  }

  if (user.status !== "ACTIVE") {
    throw new AppError(
      403,
      `Your account is ${user.status.toLowerCase()}`,
    );
  }

  const passwordMatched = await bcrypt.compare(
    payload.password,
    user.password,
  );

  if (!passwordMatched) {
    throw new AppError(
      401,
      "Invalid email or password",
    );
  }

  const userData = await getUserById(user.id);

  if (!userData) {
    throw new AppError(
      404,
      "User profile not found",
    );
  }

  const tokens = createTokens({
    id: user.id,
    role: user.role,
  });

  // Audit log: password login
  await logActivity({
    action: AuditAction.LOGIN,
    entity: "User",
    entityId: user.id,
    description: "User logged in successfully using password",
    newData: {
      loginMethod: "PASSWORD",
    },
  });

  return {
    user: userData,
    ...tokens,
  };
};

// ============================================================
// GOOGLE LOGIN
// ============================================================

export const googleLoginUser = async (
  payload: GoogleLoginInput,
) => {
  let decodedToken;

  // ----------------------------------------------------------
  // Verify Firebase / Google ID token
  // ----------------------------------------------------------

  try {
    decodedToken = await firebaseAuth.verifyIdToken(
      payload.idToken,
    );
  } catch {
    throw new AppError(
      401,
      "Invalid or expired Google authentication token",
    );
  }

  const email = decodedToken.email?.toLowerCase();

  if (!email) {
    throw new AppError(
      400,
      "Google account email is required",
    );
  }

  const googleId = decodedToken.uid;

  const googleName =
    decodedToken.name ||
    email.split("@")[0];

  const profileImage =
    decodedToken.picture || null;

  // ----------------------------------------------------------
  // Find existing account
  // ----------------------------------------------------------

  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [
        {
          googleId,
        },
        {
          email,
        },
      ],
      deletedAt: null,
    },
  });

  // ==========================================================
  // EXISTING GOOGLE ACCOUNT
  // ==========================================================

  if (existingUser) {
    if (existingUser.status !== "ACTIVE") {
      throw new AppError(
        403,
        `Your account is ${existingUser.status.toLowerCase()}`,
      );
    }

    // Update Google information if needed
    if (
      !existingUser.googleId ||
      existingUser.profileImage !== profileImage
    ) {
      await prisma.user.update({
        where: {
          id: existingUser.id,
        },
        data: {
          googleId,
          profileImage:
            profileImage ||
            existingUser.profileImage,
        },
      });
    }

    const userData = await getUserById(
      existingUser.id,
    );

    if (!userData) {
      throw new AppError(
        404,
        "User profile not found",
      );
    }

    const tokens = createTokens({
      id: existingUser.id,
      role: existingUser.role,
    });

    // Audit log: Google login
    await logActivity({
      action: AuditAction.LOGIN,
      entity: "User",
      entityId: existingUser.id,
      description:
        "User logged in successfully using Google",
      newData: {
        loginMethod: "GOOGLE",
      },
    });

    return {
      user: userData,
      ...tokens,
    };
  }

  // ==========================================================
  // NEW GOOGLE ACCOUNT
  // ==========================================================

  if (!payload.role) {
    throw new AppError(
      400,
      "Role is required for a new Google account",
    );
  }

  if (!payload.departmentId) {
    throw new AppError(
      400,
      "departmentId is required for a new Google account",
    );
  }

  // ----------------------------------------------------------
  // Validate department
  // ----------------------------------------------------------

  const department =
    await prisma.department.findFirst({
      where: {
        id: payload.departmentId,
        deletedAt: null,
      },
    });

  if (!department) {
    throw new AppError(
      404,
      "Department not found",
    );
  }

  // ----------------------------------------------------------
  // Validate Student fields
  // ----------------------------------------------------------

  if (
    payload.role === "STUDENT" &&
    (!payload.studentId ||
      !payload.batch)
  ) {
    throw new AppError(
      400,
      "studentId and batch are required for Google student registration",
    );
  }

  // ----------------------------------------------------------
  // Validate Faculty fields
  // ----------------------------------------------------------

  if (
    payload.role === "FACULTY" &&
    !payload.employeeId
  ) {
    throw new AppError(
      400,
      "employeeId is required for Google faculty registration",
    );
  }

  // ----------------------------------------------------------
  // Create User + Student/Faculty
  // ----------------------------------------------------------

  const result = await prisma.$transaction(
    async (transaction) => {
      const user =
        await transaction.user.create({
          data: {
            name: googleName,
            email,
            password: null,
            role: payload.role!,
            status: "ACTIVE",
            googleId,
            profileImage,
          },
        });

      // Create Student profile
      if (payload.role === "STUDENT") {
        await transaction.student.create({
          data: {
            studentId: payload.studentId!,
            userId: user.id,
            departmentId: payload.departmentId!,
            semester: payload.semester ?? 1,
            batch: payload.batch!,
            phone: payload.phone,
            address: payload.address,
          },
        });
      }

      // Create Faculty profile
      if (payload.role === "FACULTY") {
        await transaction.faculty.create({
          data: {
            employeeId: payload.employeeId!,
            userId: user.id,
            departmentId: payload.departmentId!,
            designation:
              payload.designation ??
              "Lecturer",
            phone: payload.phone,
            specialization:
              payload.specialization,
          },
        });
      }

      return transaction.user.findUniqueOrThrow({
        where: {
          id: user.id,
        },
        select: publicUserSelect,
      });
    },
  );

  // Audit log: new Google account
  await logActivity({
    action: AuditAction.CREATE,
    entity: "User",
    entityId: result.id,
    description: `New ${result.role.toLowerCase()} account created using Google`,
    newData: {
      email: result.email,
      name: result.name,
      role: result.role,
      loginMethod: "GOOGLE",
    },
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

// ============================================================
// REFRESH ACCESS TOKEN
// ============================================================

export const refreshAccessToken = async (
  refreshToken: string,
) => {
  let decodedToken: ReturnType<
    typeof verifyRefreshToken
  >;

  try {
    decodedToken =
      verifyRefreshToken(refreshToken);
  } catch {
    throw new AppError(
      401,
      "Invalid or expired refresh token",
    );
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
    throw new AppError(
      401,
      "User account not found",
    );
  }

  if (user.status !== "ACTIVE") {
    throw new AppError(
      403,
      "Your account is not active",
    );
  }

  return {
    accessToken: generateAccessToken({
      userId: user.id,
      role: user.role,
    }),
  };
};

// ============================================================
// GET CURRENT USER
// ============================================================

export const getCurrentUser = async (
  userId: string,
) => {
  const user = await getUserById(userId);

  if (!user) {
    throw new AppError(
      404,
      "User not found",
    );
  }

  if (user.status !== "ACTIVE") {
    throw new AppError(
      403,
      "Your account is not active",
    );
  }

  return user;
};