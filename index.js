const { app, pool } = require("./app");
const port = process.env.PORT || 3000;

// This is the ONLY place the server should start
const server = app.listen(port, () =>
  console.log(`Server is listening on port ${port}...`)
);

// Shutdown and Process logic stays here
async function shutdown(code = 0) {
  console.log("Shutting down gracefully...");
  try {
    await new Promise((resolve) => server.close(resolve));
    await pool.end();
  } finally {
    process.exit(code);
  }
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));
process.on("uncaughtException", (err) => {
  console.error("Uncaught exception:", err);
  shutdown(1);
});
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled rejection:", reason);
  shutdown(1);
});
