const express = require("express");
const router = express.Router();
const { getTodayEvents, getUpcomingEvents } = require("../controllers/specialDayController");
const { protect } = require("../middleware/authMiddleware");

// All routes are protected by JWT
router.get("/today",    protect, getTodayEvents);
router.get("/upcoming", protect, getUpcomingEvents);

module.exports = router;
