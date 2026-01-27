const { StatusCodes } = require("http-status-codes");
const { userSchema } = require("./../validation/userSchema");

const pool = require("./../db/pg-pool");

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
  console.log("EJECUTANDO DESDE EL ARCHIVO CORRECTO - RUTA:", __filename);

  const requestId = Math.random();
  console.log("Register called. Request ID:", requestId);
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
    const savedUser = await pool.query(
      `INSERT INTO users (email, name, hashed_password) 
      VALUES ($1, $2, $3) RETURNING id, email, name`,
      [newUser.email, newUser.name, newUser.password],
    ); // note that you use a parameterized query

    global.user_id = savedUser.rows[0].id; // After the registration step, the user is set to logged on.
    delete req.body.password;
    res.status(201).json({
      message: "everything worked.",
      name: savedUser.rows[0].name,
      email: savedUser.rows[0].email,
    });
  } catch (e) {
    // the email might already be registered
    if (e.code === "23505") {
      // this means the unique constraint for email was violated
      // here you return the 400 and the error message.  Use a return statement, so that
      // you don't keep going in this function
      return res.status(400).json({ message: e.message });
    }
    return next(e);
  }
}

async function logon(req, res) {
  const result = await pool.query("SELECT * FROM users WHERE email = $1", [
    req.body.email,
  ]);

  if (!result.rows.length) {
    return res.status(401).json({ message: "Authentication Failed" });
  }
  const user = result.rows[0];
  console.log(user);
  if (user) {
    const isMatch = await comparePassword(
      req.body.password,
      user.hashed_password,
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
