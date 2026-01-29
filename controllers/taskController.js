const { taskSchema, patchTaskSchema } = require("./../validation/taskSchema");
const { StatusCodes } = require("http-status-codes");
const pool = require("./../db/pg-pool");
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
  const newTaskReturn = await pool.query(
    `INSERT INTO tasks (title, is_completed, user_id) 
  VALUES ( $1, $2, $3 ) RETURNING id, title, is_completed`,
    [newTask.title, newTask.isCompleted, parseInt(newTask.userId)],
  );

  // we don't send back the userId! This statement removes it.
  res.status(201).json(newTaskReturn.rows[0]);
}

async function index(req, res) {
  const userTasks = await pool.query(`SELECT * FROM tasks WHERE user_id = $1`, [
    parseInt(global.user_id),
  ]);

  if (userTasks.rows.length > 0) {
    const sanitizedTasks = userTasks.rows.map((task) => {
      const { user_id, ...sanitizedTask } = task;
      return sanitizedTask;
    });
    res.status(200).json(sanitizedTasks);
  } else {
    return res.status(404).json({ message: "No tasks found" });
  }
}
async function show(req, res) {
  const task = await pool.query(
    `SELECT * FROM tasks WHERE id = $1 
    AND user_id = $2`,
    [req.params.id, parseInt(global.user_id)],
  );
  res.status(200).json(task.rows[0]);
}
async function update(req, res) {
  const { error, value } = patchTaskSchema.validate(req.body, {
    abortEarly: false,
  });
  if (error) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      message: error.message,
    });
  }

  let keys = Object.keys(value);
  keys = keys.map((key) => (key === "isCompleted" ? "is_completed" : key));
  const setClauses = keys.map((key, i) => `${key} = $${i + 1}`).join(", ");
  const idParm = `$${keys.length + 1}`;
  const userParm = `$${keys.length + 2}`;
  const updatedTask = await pool.query(
    `UPDATE tasks SET ${setClauses} 
  WHERE id = ${idParm} AND user_id = ${userParm} RETURNING id, title, is_completed`,
    [
      ...Object.values(value),
      parseInt(req.params.id),
      parseInt(global.user_id),
    ],
  );

  if (updatedTask.rows.length) {
    res.status(200).json(updatedTask.rows[0]);
  } else {
    res.status(404).json({ message: "there's no task with this id" });
  }
}
async function deleteTask(req, res) {
  const taskToFind = parseInt(req.params?.id); // if there are no params, the ? makes sure that you
  // get a null
  if (!taskToFind) {
    return res
      .status(400)
      .json({ message: "The task ID passed is not valid." });
  }
  const deletedTask = await pool.query(
    `DELETE FROM tasks WHERE id = $1 
    AND user_id = $2 RETURNING id, title, is_completed`,
    [parseInt(req.params.id), parseInt(global.user_id)],
  );

  if (deletedTask.rows.length === 0) {
    return res.status(404).json({ message: "Task not found or unauthorized" });
  }

  return res.status(200).json(deletedTask.rows[0]);
}

module.exports = { create, index, show, update, deleteTask };
