const {
  taskSchema,
  patchTaskSchema,
  arrayTaskSchema,
} = require("./../validation/taskSchema");
const { StatusCodes } = require("http-status-codes");
const { paginationSchema } = require("../validation/userSchema");
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
    userId: req.user.id,
  };

  console.log(newTask);

  const task = await prisma.task.create({
    data: {
      title: newTask.title,
      isCompleted: newTask.isCompleted,
      userId: newTask.userId,
      priority: newTask.priority,
    },
    select: { title: true, isCompleted: true, id: true, priority: true }, // specify the column values to return
  });

  res.status(201).json(task);
}

async function index(req, res) {
  const limitPage = { limit: req.query.limit, page: req.query.page };
  const { error, value } = paginationSchema.validate(limitPage);

  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  const page = parseInt(value.page) || 1;
  const limit = parseInt(value.limit) || 10;
  const skip = (page - 1) * limit;

  const whereClause = { userId: req.user.id };
  const { isCompleted, find, min_date, max_date, priority } = req.query;

  if (find) {
    whereClause.title = {
      contains: find,
      mode: "insensitive",
    };
  }
  if (priority) {
    whereClause.priority = priority;
  }
  if (isCompleted !== undefined) {
    whereClause.isCompleted = isCompleted === "true";
  }
  if (min_date) {
    whereClause.createdAt = {
      gte: new Date(min_date),
    };
  }
  if (max_date) {
    whereClause.createdAt = {
      lte: new Date(max_date),
    };
  }

  const userTasks = await prisma.task.findMany({
    where: whereClause,
    select: {
      id: true,
      title: true,
      isCompleted: true,
      priority: true,
      createdAt: true,
      User: {
        select: {
          name: true,
          email: true,
        },
      },
    },
    skip: skip,
    take: limit,
    orderBy: { createdAt: "desc" },
  });

  const totalTasks = await prisma.task.count({
    where: whereClause,
  });

  const pagination = {
    page,
    limit,
    total: totalTasks,
    pages: Math.ceil(totalTasks / limit),
    hasNext: page * limit < totalTasks,
    hasPrev: page > 1,
  };

  if (userTasks.length > 0) {
    res.status(200).json({ tasks: userTasks, pagination });
  } else {
    return res.status(404).json({ message: "No tasks found" });
  }
}
async function show(req, res) {
  const taskId = parseInt(req.params.id);

  if (isNaN(taskId)) {
    return res.status(400).json({ error: "Invalid user ID" });
  }

  const userTask = await prisma.task.findUnique({
    where: {
      id: taskId,
      userId: req.user.id,
    },
    select: {
      id: true,
      title: true,
      isCompleted: true,
      priority: true,
      createdAt: true,
      User: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  if (!userTask) {
    return res.status(404).json({ message: "User not found" });
  }

  res.status(200).json(userTask);
  // const userTask = await prisma.task.findUnique({
  //   where: {
  //     id_userId: {
  //       id: parseInt(req.params.id),
  //       userId: parseInt(global.user_id),
  //     },
  //   },
  // });

  // if (!userTask) {
  //   return res.status(404).json({ message: "The task was not found." });
  // }
  // res.status(200).json(userTask);
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
      data: {
        title: value.title,
        isCompleted: value.isCompleted,
        priority: value.priority,
      },
      where: {
        id_userId: {
          id: parseInt(req.params.id),
          userId: parseInt(req.user.id),
        },
      },
      select: { title: true, isCompleted: true, id: true, priority: true },
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
async function updateMany(req, res, next) {
  if (!req.body?.data) {
    return res.status(400).json({ message: "The Tasks were not found." });
  }
  if (!req.body.data.length) {
    return res.status(400).json({ message: "There're no tasks in the body" });
  }
  const { error, value } = arrayTaskSchema.validate(req.body.data, {
    abortEarly: false,
  });
  if (error) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      message: error.message,
    });
  }

  try {
    const updatedTasks = await prisma.$transaction(
      value.map((taskItem) =>
        prisma.task.update({
          where: {
            id_userId: {
              id: taskItem.id,
              userId: parseInt(req.user.id),
            },
          },
          data: {
            title: taskItem.title,
            isCompleted: taskItem.isCompleted,
            priority: taskItem.priority,
          },
          select: { title: true, isCompleted: true, id: true, priority: true },
        }),
      ),
    );
    res.status(200).json(updatedTasks);
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
          userId: parseInt(req.user.id),
        },
      },
      select: { title: true, isCompleted: true, priority: true, id: true },
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

async function bulkCreate(req, res, next) {
  const { tasks } = req.body;

  // Validate the tasks array
  if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
    return res.status(400).json({
      error: "Invalid request data. Expected an array of tasks.",
    });
  }

  // Validate all tasks before insertion
  const validTasks = [];
  for (const task of tasks) {
    const { error, value } = taskSchema.validate(task);
    if (error) {
      return res.status(400).json({
        error: "Validation failed",
        details: error.details,
      });
    }
    validTasks.push({
      title: value.title,
      isCompleted: value.isCompleted || false,
      priority: value.priority || "medium",
      userId: req.user.id,
    });
  }

  // Use createMany for batch insertion
  try {
    const result = await prisma.task.createMany({
      data: validTasks,
      skipDuplicates: false,
    });

    res.status(201).json({
      message: "success!",
      tasksCreated: result.count,
      totalRequested: validTasks.length,
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  create,
  index,
  show,
  update,
  deleteTask,
  bulkCreate,
  updateMany,
};
