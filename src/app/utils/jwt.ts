import jwt, { type SignOptions } from "jsonwebtoken";

type JwtPayload = {
  userId: string;
  role: string;
};

const getAccessSecret = (): string => {
  const secret = process.env.JWT_ACCESS_SECRET;

  if (!secret) {
    throw new Error("JWT_ACCESS_SECRET is not configured");
  }

  return secret;
};

const getRefreshSecret = (): string => {
  const secret = process.env.JWT_REFRESH_SECRET;

  if (!secret) {
    throw new Error("JWT_REFRESH_SECRET is not configured");
  }

  return secret;
};

export const generateAccessToken = (payload: JwtPayload): string => {
  const expiresIn = process.env.JWT_ACCESS_EXPIRES_IN || "15m";

  return jwt.sign(payload, getAccessSecret(), {
    expiresIn: expiresIn as SignOptions["expiresIn"],
  });
};

export const generateRefreshToken = (payload: JwtPayload): string => {
  const expiresIn = process.env.JWT_REFRESH_EXPIRES_IN || "7d";

  return jwt.sign(payload, getRefreshSecret(), {
    expiresIn: expiresIn as SignOptions["expiresIn"],
  });
};

export const verifyAccessToken = (token: string): JwtPayload => {
  return jwt.verify(token, getAccessSecret()) as JwtPayload;
};

export const verifyRefreshToken = (token: string): JwtPayload => {
  return jwt.verify(token, getRefreshSecret()) as JwtPayload;
};