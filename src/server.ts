import dotenv from "dotenv";
import app from "./app.js";
import prisma from "./config/prisma.js";

dotenv.config();

const PORT = Number(process.env.PORT) || 5000;

const startServer = async () => {
  try {
    await prisma.$connect();

    console.log("🗄️ Database connected successfully.");

    const server = app.listen(PORT, () => {
      console.log(
        `🚀 University Management API running on http://localhost:${PORT}`,
      );
    });

    const shutdown = async (signal: string) => {
      console.log(`\n${signal} received. Shutting down server...`);

      server.close(async () => {
        await prisma.$disconnect();

        console.log("🛑 Server closed successfully.");
        console.log("🗄️ Database disconnected.");

        process.exit(0);
      });
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
  } catch (error) {
    console.error("❌ Failed to start server:", error);

    await prisma.$disconnect();

    process.exit(1);
  }
};

startServer();