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
  let user = null;

  // Your middleware here
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
    user = await prisma.user.create({
      data: {
        name: newUser.name,
        email: newUser.email,
        hashedPassword: newUser.password,
      },
      select: { name: true, email: true, id: true }, // specify the column values to return
    });

    global.user_id = user.id; // After the registration step, the user is set to logged on.
    delete req.body.password;
    res.status(201).json({
      message: "everything worked.",
      name: user.name,
      email: user.email,
    });
  } catch (err) {
    if (err.name === "PrismaClientKnownRequestError" && err.code === "P2002") {
      // send the appropriate error back -- the email was already registered
      return res
        .status(400)
        .json({ message: "The email is already registered." });
    } else {
      return next(err); // the error handler takes care of other errors
    }
  }
}

async function logon(req, res) {
  const user = await prisma.user.findUnique({
    where: { email: req.body.email },
  });

  // const result = await pool.query("SELECT * FROM users WHERE email = $1", [
  //   req.body.email,
  // ]);

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

module.exports = { register, logon, logoff };
