const { StatusCodes } = require("http-status-codes");
const { userSchema } = require("./../validation/userSchema");
const { OAuth2Client } = require("google-auth-library");
const prisma = require("./../db/prisma");

const crypto = require("crypto");
const util = require("util");
const scrypt = util.promisify(crypto.scrypt);
// google OAuth
const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  "postmessage", // Must match the frontend 'auth-code' flow
);

//Security
const { randomUUID } = require("crypto");
const jwt = require("jsonwebtoken");

const cookieFlags = (req) => {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // only when HTTPS is available
    sameSite: "Lax",
  };
};

const setJwtCookie = (req, res, user) => {
  // Sign JWT
  const payload = { id: user.id, csrfToken: randomUUID() };
  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" }); // 1 hour expiration
  // Set cookie.  Note that the cookie flags have to be different in production and in test.
  res.cookie("jwt", token, { ...cookieFlags(req), maxAge: 3600000 }); // 1 hour expiration
  return payload.csrfToken; // this is needed in the body returned by logon() or register()
};

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
  let isPerson = false;
  if (req.body.recaptchaToken) {
    const token = req.body.recaptchaToken;
    const params = new URLSearchParams();
    params.append("secret", process.env.RECAPTCHA_SECRET);
    params.append("response", token);
    params.append("remoteip", req.ip);
    const response = await fetch(
      // might throw an error that would cause a 500 from the error handler
      "https://www.google.com/recaptcha/api/siteverify",
      {
        method: "POST",
        body: params.toString(),
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      },
    );
    const data = await response.json();
    if (data.success) isPerson = true;
    delete req.body.recaptchaToken;
  } else if (
    process.env.RECAPTCHA_BYPASS &&
    req.get("X-Recaptcha-Test") === process.env.RECAPTCHA_BYPASS
  ) {
    // might be a test environment
    isPerson = true;
  }
  if (!isPerson) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: "We can't tell if you're a person or a bot." });
  }
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

    const csrfToken = setJwtCookie(req, res, result.user);

    result.user.csrfToken = csrfToken;

    // Send response with status 201
    res.status(201);
    res.json({
      user: result.user,
      welcomeTasks: result.welcomeTasks,
      transactionStatus: "success",
      csrfToken,
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
  if (user) {
    const isMatch = await comparePassword(
      req.body.password,
      user.hashedPassword,
    );
    if (isMatch) {
      console.log(user.id);
      const csrfToken = setJwtCookie(req, res, user);
      user.csrfToken = csrfToken;
      console.log("##################");
      console.log(csrfToken);
      res.status(StatusCodes.OK).json({
        message: "everything worked.",
        name: user.name,
        email: user.email,
        csrfToken: user.csrfToken,
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
  res.clearCookie("jwt", cookieFlags(req));
  res.sendStatus(StatusCodes.OK);
}

async function googleLogon(req, res) {
  try {
    const { code } = req.body;

    // 1. Exchange the frontend 'code' for tokens
    const { tokens } = await client.getToken(code);

    // 2. Verify the ID Token to get the user's Google Profile
    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const { sub, email, name, picture } = ticket.getPayload();

    let newUser = { name, email, password: sub };

    newUser.password += "Pepito7%";

    const { error, value } = userSchema.validate(newUser, {
      abortEarly: false,
    });
    if (error) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: error.message,
        name: newUser.name,
        email: newUser.email,
      });
    }
    newUser = value;
    newUser.password = await hashPassword(newUser.password);

    // 1. Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true },
    });

    if (existingUser) {
      // LOGIN CASE: Just set the cookie and return 200
      const csrfToken = setJwtCookie(req, res, existingUser);
      return res.status(200).json({
        ...existingUser,
        csrfToken,
      });
    }
    // 2. REGISTER CASE: Run your existing transaction
    const result = await prisma.$transaction(async (tx) => {
      const newUserResult = await tx.user.create({
        data: {
          email: email,
          name: name,
          hashedPassword: newUser.password,
        },
        select: { id: true, email: true, name: true },
      });

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

      const welcomeTasks = await tx.task.findMany({
        where: { userId: newUserResult.id },
      });

      return { user: newUserResult, welcomeTasks };
    });

    const csrfToken = setJwtCookie(req, res, result.user);

    return res.status(201).json({
      user: result.user,
      welcomeTasks: result.welcomeTasks,
      csrfToken,
    });
  } catch (error) {
    console.error("Google Logon Error:", error);
    return res.status(401).json({ message: "Authentication failed" });
  }
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

module.exports = { register, logon, logoff, show, googleLogon };
