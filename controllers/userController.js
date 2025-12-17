const memoryStore = require("../week-3-middleware/memoryStore");
const { StatusCodes } = require("http-status-codes");

function register(req, res) {
  console.log("register");
  // Your middleware here
  const newUser = { ...req.body }; // this makes a copy
  memoryStore.storedUsers.push(newUser);
  memoryStore.user_id = newUser; // After the registration step, the user is set to logged on.
  delete req.body.password;
  res.status(StatusCodes.CREATED).json({
    message: "everything worked.",
    user: { name: newUser.name, email: newUser.email },
  });
}

function logon(req, res) {
  const user = memoryStore.storedUsers.find((e) => {
    return e.email == req.body.email;
  });
  if (user) {
    if (user.password == req.body.password) {
      memoryStore.user_id = user;
      res.status(StatusCodes.OK).json({
        message: "everything worked.",
        user: { name: user.name, email: user.email },
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
  memoryStore.user_id = null;
  res.sendStatus(StatusCodes.OK);
}

module.exports = { register, logon, logoff };
