const express = require("express");
const {
  create,
  index,
  show,
  update,
  deleteTask,
  bulkCreate,
} = require("./../controllers/taskController");
const router = express.Router();

router.route("/").post(create);
router.route("/").get(index);
router.route("/:id").get(show);
router.route("/:id").patch(update);
router.route("/:id").delete(deleteTask);
router.route("/bulk").post(bulkCreate);

module.exports = router;
