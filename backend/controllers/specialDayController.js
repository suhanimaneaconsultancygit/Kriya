const SpecialDay = require("../models/SpecialDay");

// Helper: get "MM-DD" string from a Date object
const toMMDD = (date) => {
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${mm}-${dd}`;
};

// GET /api/special-days/today
const getTodayEvents = async (req, res) => {
  try {
    const today = toMMDD(new Date());
    const events = await SpecialDay.find({ date: today }).select("-__v").lean();
    res.json({ success: true, date: today, events });
  } catch (err) {
    console.error("getTodayEvents error:", err.message);
    res.status(500).json({ success: false, message: "Failed to fetch today's events" });
  }
};

// GET /api/special-days/upcoming?days=7
const getUpcomingEvents = async (req, res) => {
  try {
    const daysAhead = Math.min(parseInt(req.query.days) || 7, 30);

    const dates = [];
    for (let i = 1; i <= daysAhead; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      dates.push(toMMDD(d));
    }

    const events = await SpecialDay.find({ date: { $in: dates } })
      .select("-__v")
      .lean();

    // Sort by the order they appear (chronological)
    events.sort((a, b) => dates.indexOf(a.date) - dates.indexOf(b.date));

    res.json({ success: true, events });
  } catch (err) {
    console.error("getUpcomingEvents error:", err.message);
    res.status(500).json({ success: false, message: "Failed to fetch upcoming events" });
  }
};

module.exports = { getTodayEvents, getUpcomingEvents };
