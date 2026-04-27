const Report = require("../models/Report");
const User = require("../models/User");
const { ROLE_RANK } = require("../middleware/authMiddleware");

// GET /api/reports
const getReports = async (req, res) => {
  try {
    const { date, userId } = req.query;
    let allowedUserIds = [req.user._id];

    if (req.user.role === "admin") {
      const all = await User.find({ isActive: true }).select("_id");
      allowedUserIds = all.map((u) => u._id);
    } else if (req.user.role === "sub_admin") {
      const users = await User.find({ role: { $ne: "admin" }, isActive: true }).select("_id");
      allowedUserIds = users.map((u) => u._id);
    } else if (req.user.role === "team_lead") {
      const users = await User.find({ role: { $in: ["member", "intern"] }, isActive: true }).select("_id");
      allowedUserIds = [req.user._id, ...users.map((u) => u._id)];
    } else if (req.user.role === "member") {
      const users = await User.find({ role: "intern", isActive: true }).select("_id");
      allowedUserIds = [req.user._id, ...users.map((u) => u._id)];
    }

    let query = { user: { $in: allowedUserIds } };
    if (date) query.date = date;
    if (userId) query.user = userId;

    const reports = await Report.find(query)
      .populate("user", "name email role team avatar")
      .sort({ date: -1, createdAt: -1 });

    res.json({ success: true, count: reports.length, reports });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/reports/today
const getTodayReport = async (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const report = await Report.findOne({ user: req.user._id, date: today })
      .populate("user", "name email role team avatar");
    res.json({ success: true, report: report || null });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/reports
const upsertReport = async (req, res) => {
  try {
    const { summary, mood, workData, date } = req.body;
    if (!summary) return res.status(400).json({ success: false, message: "Summary is required." });

    const reportDate = date || new Date().toISOString().slice(0, 10);
    const report = await Report.findOneAndUpdate(
      { user: req.user._id, date: reportDate },
      { user: req.user._id, date: reportDate, summary, mood: mood || "good", workData: workData || { rawSummary: summary } },
      { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true }
    );
    await report.populate("user", "name email role team avatar");
    res.status(200).json({ success: true, message: "Report saved!", report });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/reports/:id
const deleteReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ success: false, message: "Report not found." });
    const isOwner  = report.user.toString() === req.user._id.toString();
    const isSenior = ["admin", "sub_admin"].includes(req.user.role);
    if (!isOwner && !isSenior) return res.status(403).json({ success: false, message: "You can only delete your own reports." });
    await report.deleteOne();
    res.json({ success: true, message: "Report deleted." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getReports, getTodayReport, upsertReport, deleteReport };
