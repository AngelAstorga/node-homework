const { StatusCodes } = require("http-status-codes");
const memoryStore = require("../week-3-middleware/memoryStore");
module.exports = (req, res, next) => {
  if (memoryStore.user_id == null) {
    res.status(StatusCodes.UNAUTHORIZED).json({ message: "unauthorized" });
  }
  next();
};
