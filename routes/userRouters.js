const {
  register,
  logon,
  logoff,
  show,
} = require("./../controllers/userController");
const express = require("express");
const router = express.Router();

router.route("/").post(register);
router.route("/logon").post(logon);
router.route("/logoff").post(logoff);
router.route("/show/:id").get(show);

module.exports = router;
