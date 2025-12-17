const express = require("express");
const path = require("path");
const { StatusCodes } = require("http-status-codes");
const { ValidationError, NotFoundError } = require("../errors");
const router = express.Router();
const dogs = require("../dogData.js");
const { v4: uuidv4 } = require("uuid");
//Middleware Request Validation import
const {
  postRequestValidation,
} = require("../advancedMiddleware/requestValidation.js");

//1. Request ID middleware
router.use((req, res, next) => {
  const requestId = uuidv4();
  req.requestId = requestId;
  next();
});
//2. Logging middleware
router.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}]: ${req.method} ${req.path} (${req.requestId})`);
  next();
});
// 3. Security Headers
router.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  next();
});
// Request Size Limiting
router.use(express.json({ limit: "1mb" }));
// 5. Validation middleware post requests
router.use(postRequestValidation);
//6 Routes
router.get("/dogs", (req, res) => {
  res.json(dogs);
});

router.post("/adopt", (req, res) => {
  const { name, email, dogName } = req.body;
  if (!name || !email || !dogName) {
    throw new ValidationError("Missing required fields");
    //return res.status(400).json({ error: "All fields are required" });
  }
  // checking dog in the list
  if (
    !dogs.find((dog) => {
      return dog.name == dogName;
    })
  ) {
    throw new NotFoundError(
      "Missing Dog not found or not available for adoption fields"
    );
  }
  return res.status(201).json({
    message: `Adoption request received. We will contact you at ${email} for further details.`,
  });
});
router.get("/images/dachshund.png", (req, res) => {
  const imagePath = path.join(__dirname, "../public/images/dachshund.png");
  res.sendFile(imagePath);
});
router.get("/error", (req, res) => {
  throw new Error("Test error");
});

//7. Error handling middleware

router.use((err, req, res, next) => {
  // Determine the status code from the error
  const statusCode = err.statusCode || 500;

  // Log based on error type
  if (statusCode >= 400 && statusCode < 500) {
    // 4xx errors: client errors (use console.warn)
    // This includes ValidationError (400), UnauthorizedError (401), NotFoundError (404)
    console.warn(`WARN: ${err.name}`, err.message);
  } else {
    // 5xx errors: server errors (use console.error)
    console.error(`ERROR: Error`, err.message);
  }

  // Send error response
  res.status(statusCode).json({
    error: err.message || "Internal Server Error",
    requestId: req.requestId,
  });
});
//8. 404 handler

router.use((req, res, next) => {
  res.status(StatusCodes.NOT_FOUND).json({
    error: "Route Not Found",
    path: req.originalUrl,
    requestId: req.requestId,
  });
});
module.exports = router;
