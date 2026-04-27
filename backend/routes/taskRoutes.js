const express = require("express");
const router  = express.Router();
const { getTasks, getTask, createTask, updateTask, reassignTask, deleteTask, getStats } = require("../controllers/taskController");
const { protect } = require("../middleware/authMiddleware");

router.use(protect);

router.get("/stats",          getStats);
router.route("/").get(getTasks).post(createTask);
router.route("/:id").get(getTask).put(updateTask).delete(deleteTask);
router.put("/:id/reassign",   reassignTask);

module.exports = router;
