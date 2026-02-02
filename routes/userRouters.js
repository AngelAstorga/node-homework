const {
  register,
  logon,
  logoff,
  show,
} = require("./../controllers/userController");
const jwtMiddleware = require("./../middleware/jwtMiddleware");

const express = require("express");
const router = express.Router();
router.route("/logon").post(logon);
router.route("/").post(register);
router.route("/register").post(register);
router.use(jwtMiddleware);
router.route("/logoff").post(logoff);
router.route("/show/:id").get(show);

module.exports = router;
