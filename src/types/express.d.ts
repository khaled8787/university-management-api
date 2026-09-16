import type { AuthenticatedUser } from "../app/middlewares/auth.js";

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export {};