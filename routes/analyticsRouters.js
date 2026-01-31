const express = require("express");
const {
  getUserAnalytics,
  getUsersWithStats,
  searchTasks,
} = require("./../controllers/analyticsController");
const router = express.Router();

router.route("/users/:id").get(getUserAnalytics);
router.route("/users").get(getUsersWithStats);
router.route("/tasks/search").get(searchTasks);

module.exports = router;
