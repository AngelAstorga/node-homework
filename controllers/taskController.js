const memoryStore = require("./../week-3-middleware/memoryStore");
const { taskSchema, patchTaskSchema } = require("./../validation/taskSchema");
const { StatusCodes } = require("http-status-codes");
const taskCounter = (() => {
  let lastTaskNumber = 0;
  return () => {
    lastTaskNumber += 1;
    return lastTaskNumber;
  };
})();

function create(req, res) {
  const { error, value } = taskSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      message: error.message,
    });
  }

  const newTask = {
    isCompleted: false,
    ...value,
    id: taskCounter(),
    userId: memoryStore.user_id.email,
  };
  memoryStore.tasks.push(newTask);
  const { userId, ...sanitizedTask } = newTask;
  // we don't send back the userId! This statement removes it.
  res.status(StatusCodes.CREATED).json(sanitizedTask);
}
function index(req, res) {
  const userTasks = memoryStore.tasks.filter(
    (task) => task.userId === memoryStore.user_id.email
  );
  if (userTasks.length > 0) {
    const sanitizedTasks = userTasks.map((task) => {
      const { userId, ...sanitizedTask } = task;
      return sanitizedTask;
    });
    res.status(200).json(sanitizedTasks);
  } else {
    res.status(404).json(userTasks);
  }
}
function show(req, res) {
  const task = memoryStore.tasks.filter((task) => {
    return parseInt(req.params.id) == task.id;
  });

  if (task) {
    const { userId, ...cleanTask } = task[0];
    res.status(200).json(cleanTask);
  } else {
    res.status(200).json({ message: "there's no task for this id" });
  }
}
function update(req, res) {
  const { error, value } = patchTaskSchema.validate(req.body, {
    abortEarly: false,
  });
  if (error) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      message: error.message,
    });
  }
  const task = memoryStore.tasks.find((task) => {
    return (
      parseInt(req.params.id) == task.id &&
      task.userId === memoryStore.user_id.email
    );
  });
  if (task) {
    Object.assign(task, value);
    const { userId, ...cleanTask } = task;
    res.status(200).json(cleanTask);
  } else {
    res.status(404).json({ message: "there's no task with this id" });
  }
}
function deleteTask(req, res) {
  const taskToFind = parseInt(req.params?.id); // if there are no params, the ? makes sure that you
  // get a null
  if (!taskToFind) {
    return res
      .status(400)
      .json({ message: "The task ID passed is not valid." });
  }
  const taskIndex = memoryStore.tasks.findIndex(
    (task) =>
      task.id === taskToFind && task.userId === memoryStore.user_id.email
  );
  // we get the index, not the task, so that we can splice it out
  if (taskIndex === -1) {
    // if no such task
    return res
      .status(StatusCodes.NOT_FOUND)
      .json({ message: "That task was not found" });
    // else it's a 404.
  }
  const { userId, ...task } = memoryStore.tasks[taskIndex]; // make a copy without userId
  memoryStore.tasks.splice(taskIndex, 1); // do the delete
  return res.json(task);
}

module.exports = { create, index, show, update, deleteTask };
