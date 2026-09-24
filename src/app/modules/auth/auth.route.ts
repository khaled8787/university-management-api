import { Router } from "express";

import {
  getMe,
  googleLogin,
  login,
  logout,
  refreshToken,
  register,
} from "./auth.controller.js";
import { authenticate } from "../../middlewares/auth.js";

const router = Router();

router.post("/register", register);

router.post("/login", login);

router.post("/google", googleLogin);

router.post("/refresh-token", refreshToken);

router.get("/me", authenticate, getMe);

router.post("/logout", authenticate, logout);

export default router;