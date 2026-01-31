const Joi = require("joi");

const userSchema = Joi.object({
  email: Joi.string().trim().lowercase().email().required(),
  name: Joi.string().trim().min(3).max(30).required(),
  password: Joi.string()
    .trim()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).+$/)
    .required()
    .messages({
      "string.pattern.base":
        "Password must be at least 8 characters long and include upper and lower case letters, a number, and a special character.",
    }),
});
const paginationSchema = Joi.object({
  page: Joi.number().min(1).default(1).messages({
    "number.min": "The page number must be at least 1.",
    "number.base": "The page must be a valid number.",
  }),
  limit: Joi.number().min(1).max(100).default(10).messages({
    "number.max": "You cannot request more than 100 items at a time.",
  }),
});

module.exports = { userSchema, paginationSchema };
