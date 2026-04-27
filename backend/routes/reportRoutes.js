const express = require("express");
const router = express.Router();
const { getReports, getTodayReport, upsertReport, deleteReport } = require("../controllers/reportController");
const { protect } = require("../middleware/authMiddleware");

router.use(protect);

router.get("/today",  getTodayReport);
router.get("/",       getReports);
router.post("/",      upsertReport);
router.delete("/:id", deleteReport);

module.exports = router;
