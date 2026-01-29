const { taskSchema, patchTaskSchema } = require("./../validation/taskSchema");
const { StatusCodes } = require("http-status-codes");
const pool = require("./../db/pg-pool");
const prisma = require("./../db/prisma");
const taskCounter = (() => {
  let lastTaskNumber = 0;
  return () => {
    lastTaskNumber += 1;
    return lastTaskNumber;
  };
})();

async function create(req, res) {
  const { error, value } = taskSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      message: error.message,
    });
  }

  const newTask = {
    isCompleted: false,
    ...value,
    userId: global.user_id,
  };

  console.log(newTask);

  const task = await prisma.task.create({
    data: {
      title: newTask.title,
      isCompleted: newTask.isCompleted,
      userId: newTask.userId,
    },
    select: { title: true, isCompleted: true, id: true }, // specify the column values to return
  });

  res.status(201).json(task);
}

async function index(req, res) {
  const userTasks = await prisma.task.findMany({
    where: {
      userId: global.user_id, // only the tasks for this user!
    },
    select: { title: true, isCompleted: true, id: true },
  });

  // const userTasks = await pool.query(`SELECT * FROM tasks WHERE user_id = $1`, [
  //   parseInt(global.user_id),
  // ]);

  if (userTasks.length > 0) {
    const sanitizedTasks = userTasks.map((task) => {
      const { user_id, ...sanitizedTask } = task;
      return sanitizedTask;
    });
    res.status(200).json(sanitizedTasks);
  } else {
    return res.status(404).json({ message: "No tasks found" });
  }
}
async function show(req, res) {
  const userTask = await prisma.task.findUnique({
    where: {
      id_userId: {
        id: parseInt(req.params.id),
        userId: parseInt(global.user_id),
      },
    },
  });

  if (!userTask) {
    return res.status(404).json({ message: "The task was not found." });
  }
  res.status(200).json(userTask);
}
async function update(req, res, next) {
  const { error, value } = patchTaskSchema.validate(req.body, {
    abortEarly: false,
  });
  if (error) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      message: error.message,
    });
  }
  try {
    const task = await prisma.task.update({
      data: { title: value.title, isCompleted: value.isCompleted },
      where: {
        id_userId: {
          id: parseInt(req.params.id),
          userId: parseInt(global.user_id),
        },
      },
      select: { title: true, isCompleted: true, id: true },
    });
    res.status(200).json(task);
  } catch (err) {
    if (err.code === "P2025") {
      return res.status(404).json({ message: "The task was not found." });
    } else {
      return next(err); // pass other errors to the global error handler
    }
  }
}
async function deleteTask(req, res, next) {
  const taskToFind = parseInt(req.params?.id); // if there are no params, the ? makes sure that you
  // get a null
  if (!taskToFind) {
    return res
      .status(400)
      .json({ message: "The task ID passed is not valid." });
  }

  try {
    const task = await prisma.task.delete({
      where: {
        id_userId: {
          id: parseInt(req.params.id),
          userId: parseInt(global.user_id),
        },
      },
      select: { title: true, isCompleted: true, id: true },
    });
    res.status(200).json(task);
  } catch (err) {
    if (err.code === "P2025") {
      return res.status(404).json({ message: "The task was not found." });
    } else {
      return next(err); // pass other errors to the global error handler
    }
  }
}

module.exports = { create, index, show, update, deleteTask };
