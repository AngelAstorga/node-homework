const { StatusCodes } = require("http-status-codes");
const { userSchema } = require("./../validation/userSchema");

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

async function register(req, res) {
  console.log("register");
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
  global.users.push(newUser);
  global.user_id = newUser; // After the registration step, the user is set to logged on.
  delete req.body.password;
  res.status(StatusCodes.CREATED).json({
    message: "everything worked.",
    name: newUser.name,
    email: newUser.email,
  });
}

async function logon(req, res) {
  const user = global.users.find((e) => {
    return e.email == req.body.email;
  });
  if (user) {
    const isMatch = await comparePassword(req.body.password, user.password);
    if (isMatch) {
      global.user_id = user;
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
