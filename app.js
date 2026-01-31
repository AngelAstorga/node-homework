const express = require("express");
const { v4: uuidv4 } = require("uuid");
const path = require("path");
const errorHandler = require("./middleware/error-handler");
const notFoundHandler = require("./middleware/not-found");
const authMiddleware = require("./middleware/auth");
const userRouter = require("./routes/userRouters");
const taskRouter = require("./routes/taskRouters");
const analyticsRouter = require("./routes/analyticsRouters");
const app = express();
const pool = require("./db/pg-pool");
const prisma = require("./db/prisma");

global.user_id = null;
global.users = [];
global.tasks = [];

app.use(express.json({ limit: "1kb" }));

app.get("/health", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ok", db: "connected" });
  } catch (err) {
    res
      .status(500)
      .json({ status: "error", db: "not connected", error: err.message });
  }
});

app.use("/api/tasks", authMiddleware, taskRouter);
app.use("/api/users", userRouter);
app.use("/api/analytics", authMiddleware, analyticsRouter);

app.use(notFoundHandler);
app.use(errorHandler);

const port = process.env.PORT || 3000;
const server = app.listen(port, () =>
  console.log(`Server is listening on port ${port}...`),
);

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`Port ${port} is already in use.`);
  } else {
    console.error("Server error:", err);
  }
  process.exit(1);
});

let isShuttingDown = false;
async function shutdown(code = 0) {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log("Shutting down gracefully...");
  try {
    await new Promise((resolve) => server.close(resolve));
    console.log("HTTP server closed.");
    // If you have DB connections, close them here
    await pool.end();
    await prisma.$disconnect();
    console.log("Prisma disconnected");
  } catch (err) {
    console.error("Error during shutdown:", err);
    code = 1;
  } finally {
    console.log("Exiting process...");
    process.exit(code);
  }
}

process.on("SIGINT", () => shutdown(0)); // ctrl+c
process.on("SIGTERM", () => shutdown(0)); // e.g. `docker stop`
process.on("uncaughtException", (err) => {
  console.error("Uncaught exception:", err);
  shutdown(1);
});
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled rejection:", reason);
  shutdown(1);
});

module.exports = { app, server };
