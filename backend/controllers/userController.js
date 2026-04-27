const User = require("../models/User");

// GET /api/users
const getUsers = async (req, res) => {
  try {
    const users = await User.find({ isActive: true }).select("-password").sort({ name: 1 });
    res.json({ success: true, count: users.length, users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/users/assignable — who can current user assign to?
// Rule: non-interns can assign to ANYONE; interns can only assign to interns
const getAssignableUsers = async (req, res) => {
  try {
    let query = { isActive: true };
    if (req.user.role === "intern") {
      query.role = "intern"; // interns → only other interns
    }
    // everyone else → all users

    const users = await User.find(query).select("-password").sort({ name: 1 });
    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/users/team-structure — for the Team page
const getTeamStructure = async (req, res) => {
  try {
    const allUsers = await User.find({ isActive: true }).select("-password");
    const Task     = require("../models/Task");
    const tasks    = await Task.find({}).select("assignedTo status");

    // Build task count map per user
    const taskMap = {};
    tasks.forEach((t) => {
      const uid = t.assignedTo?.toString();
      if (!uid) return;
      if (!taskMap[uid]) taskMap[uid] = { total: 0, done: 0, in_progress: 0, pending: 0 };
      taskMap[uid].total++;
      if      (t.status === "done")        taskMap[uid].done++;
      else if (t.status === "in_progress") taskMap[uid].in_progress++;
      else                                 taskMap[uid].pending++;
    });

    // Group by team
    const teams = {};
    const TEAMS = ["Web Development", "Marketing", "Designing", "Interns", "SEO", "AI Quality"];
    TEAMS.forEach((name) => { teams[name] = { teamName: name, lead: null, members: [] }; });

    allUsers.forEach((u) => {
      const stats = taskMap[u._id.toString()] || { total: 0, done: 0, in_progress: 0, pending: 0 };
      const entry = { ...u.toJSON(), taskStats: stats };
      if (!u.team) return;
      if (!teams[u.team]) teams[u.team] = { teamName: u.team, lead: null, members: [] };
      if (u.role === "team_lead") teams[u.team].lead = entry;
      else                        teams[u.team].members.push(entry);
    });

    res.json({ success: true, teams: Object.values(teams) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/users/:id/tasks
const getUserTasks = async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.id).select("-password");
    if (!targetUser) return res.status(404).json({ success: false, message: "User not found." });

    const Task  = require("../models/Task");
    const tasks = await Task.find({ assignedTo: req.params.id })
      .populate("assignedBy", "name avatar role")
      .sort({ createdAt: -1 });

    res.json({ success: true, user: targetUser, tasks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/users/:id
const getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ success: false, message: "User not found." });
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/users/profile
const updateProfile = async (req, res) => {
  try {
    const { name, email } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: "User not found." });
    if (name)  { user.name = name; user.avatar = name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase(); }
    if (email) {
      const existing = await User.findOne({ email, _id: { $ne: user._id } });
      if (existing) return res.status(409).json({ success: false, message: "Email already in use." });
      user.email = email;
    }
    await user.save();
    res.json({ success: true, message: "Profile updated.", user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/users/whatsapp-settings
const updateWhatsAppSettings = async (req, res) => {
  try {
    const { phoneNumber, whatsappOptIn } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: "User not found." });

    // When opting out, clear the phone number requirement
    if (whatsappOptIn === false) {
      user.whatsappOptIn = false;
      // Keep the stored number so user doesn't have to re-enter next time
      await user.save();
      return res.json({ success: true, message: "WhatsApp notifications disabled." });
    }

    // Validate phone number when opting in
    if (!phoneNumber) {
      return res.status(400).json({ success: false, message: "Phone number is required to enable WhatsApp notifications." });
    }

    // Must start with "+"
    if (!phoneNumber.startsWith("+")) {
      return res.status(400).json({ success: false, message: "Phone number must start with '+' and include the country code (e.g. +91XXXXXXXXXX)." });
    }

    // Extract digits only (after the +) and validate length 10–15
    const digitsOnly = phoneNumber.slice(1).replace(/\D/g, "");
    if (digitsOnly.length < 10 || digitsOnly.length > 15) {
      return res.status(400).json({ success: false, message: "Phone number must be 10–15 digits (excluding the '+')." });
    }

    user.phoneNumber   = phoneNumber;
    user.whatsappOptIn = true;
    await user.save();

    res.json({ success: true, message: "WhatsApp notification settings saved.", user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getUsers, getAssignableUsers, getTeamStructure, getUserTasks, getUser, updateProfile, updateWhatsAppSettings };
