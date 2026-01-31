const { StatusCodes } = require("http-status-codes");
const { userSchema } = require("./../validation/userSchema");

const pool = require("./../db/pg-pool");
const prisma = require("./../db/prisma");

const crypto = require("crypto");
const util = require("util");
const scrypt = util.promisify(crypto.scrypt);

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = await scrypt(password, salt, 64);
  return `${salt}:${derivedKey.toString("hex")}`;
}

async function comparePassword(inputPassword, storedHash) {
  const [salt, key] = storedHash.split(":");
  const keyBuffer = Buffer.from(key, "hex");
  const derivedKey = await scrypt(inputPassword, salt, 64);
  return crypto.timingSafeEqual(keyBuffer, derivedKey);
}

async function register(req, res, next) {
  let newUser = { ...req.body }; // this makes a copy
  const { error, value } = userSchema.validate(newUser, { abortEarly: false });
  if (error) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      message: error.message,
      name: newUser.name,
      email: newUser.email,
    });
  }
  newUser = value;
  newUser.password = await hashPassword(newUser.password);

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Create user account (similar to Assignment 6, but using tx instead of prisma)
      const newUserResult = await tx.user.create({
        data: {
          email: newUser.email,
          name: newUser.name,
          hashedPassword: newUser.password,
        },
        select: { id: true, email: true, name: true },
      });

      // Create 3 welcome tasks using createMany
      const welcomeTaskData = [
        {
          title: "Complete your profile",
          userId: newUserResult.id,
          priority: "medium",
        },
        {
          title: "Add your first task",
          userId: newUserResult.id,
          priority: "high",
        },
        { title: "Explore the app", userId: newUserResult.id, priority: "low" },
      ];
      await tx.task.createMany({ data: welcomeTaskData });

      // Fetch the created tasks to return them
      const welcomeTasks = await tx.task.findMany({
        where: {
          userId: newUserResult.id,
          title: { in: welcomeTaskData.map((t) => t.title) },
        },
        select: {
          id: true,
          title: true,
          isCompleted: true,
          userId: true,
          priority: true,
          createdAt: true,
        },
      });

      return { user: newUserResult, welcomeTasks };
    });

    // Store the user ID globally for session management (not secure for production)
    global.user_id = result.user.id;

    // Send response with status 201
    res.status(201);
    res.json({
      user: result.user,
      welcomeTasks: result.welcomeTasks,
      transactionStatus: "success",
    });
    return;
  } catch (err) {
    if (err.code === "P2002") {
      // send the appropriate error back -- the email was already registered
      return res.status(400).json({ error: "Email already registered" });
    } else {
      return next(err); // the error handler takes care of other errors
    }
  }
}

async function logon(req, res) {
  const user = await prisma.user.findUnique({
    where: { email: req.body.email },
  });

  if (!user) {
    return res.status(401).json({ message: "Authentication Failed" });
  }
  console.log(user);
  if (user) {
    const isMatch = await comparePassword(
      req.body.password,
      user.hashedPassword,
    );
    if (isMatch) {
      global.user_id = user.id;
      res.status(StatusCodes.OK).json({
        message: "everything worked.",
        name: user.name,
        email: user.email,
      });
    } else {
      res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ message: "Authentication Failed" });
    }
  } else {
    res
      .status(StatusCodes.UNAUTHORIZED)
      .json({ message: "Authentication Failed" });
  }
}

function logoff(req, res) {
  global.user_id = null;
  res.sendStatus(StatusCodes.OK);
}

async function show(req, res) {
  const userId = parseInt(req.params.id);

  if (isNaN(userId)) {
    return res.status(400).json({ error: "Invalid user ID" });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      Task: {
        where: { isCompleted: false },
        select: {
          id: true,
          title: true,
          priority: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      },
    },
  });

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  res.status(200).json(user);
}

module.exports = { register, logon, logoff, show };
