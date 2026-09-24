import express, { type Application } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

import appRoutes from "./app/routes/index.js";
import notFound from "./app/middlewares/notFound.js";
import globalErrorHandler from "./app/errors/globalErrorHandler.js";

const app: Application = express();

app.use(helmet());

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests. Please try again later.",
    errors: [],
  },
});

app.use("/api", apiLimiter);

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  }),
);

// Important:
// Stripe webhook must receive the raw request body.
// This route must be registered before express.json().
app.use(
  "/api/v1/payments/stripe/webhook",
  express.raw({ type: "application/json" }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "University Management API is running",
    data: {
      environment: process.env.NODE_ENV || "development",
    },
  });
});

app.use("/api/v1", appRoutes);

app.use(notFound);
app.use(globalErrorHandler);

export default app;