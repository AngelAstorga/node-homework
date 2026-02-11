const express = require("express");
const jwtMiddleware = require("./../middleware/jwtMiddleware");
const {
  create,
  index,
  show,
  update,
  deleteTask,
  bulkCreate,
  updateMany,
} = require("./../controllers/taskController");
const router = express.Router();
router.use(jwtMiddleware);
router.route("/").post(create);
router.route("/").get(index);

router.route("/updateMany").patch(updateMany);
router.route("/bulk").post(bulkCreate);

router.route("/:id").get(show);
router.route("/:id").patch(update);
router.route("/:id").delete(deleteTask);

module.exports = router;
