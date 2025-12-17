const { StatusCodes } = require("http-status-codes");

function postRequestValidation(req, res, next) {
  if (req.method != "POST") {
    return next();
  }
  if (!req.is("application/json")) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      error: "Content-Type must be application/json",
      requestId: req.requestId,
    });
  }
  next();
}

module.exports = { postRequestValidation };
