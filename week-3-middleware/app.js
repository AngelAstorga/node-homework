const express = require("express");
const { v4: uuidv4 } = require("uuid");
const path = require("path");
const dogsRouter = require("./routes/dogs");
const userRouter = require("./routes/userRouters");
const taskRouter = require("./routes/taskRouters");
const authMiddleware = require("./../middleware/auth");
const app = express();

app.use(express.json({ limit: "1kb" }));
app.use("/api/tasks", authMiddleware, taskRouter);
app.use("/api/users", userRouter);

app.use("/", dogsRouter); // Do not remove this line

const server = app.listen(3000, () =>
  console.log("Server listening on port 3000")
);
module.exports = server;
