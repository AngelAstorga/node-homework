const { StatusCodes } = require("http-status-codes");

const notFounded = (req, res, next) => {
  console.error("page not found");

  if (!res.headersSent) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .send(`You can't do a ${req.method} for ${req.url}`);
  }
};

module.exports = notFounded;
