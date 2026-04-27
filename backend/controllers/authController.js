const jwt = require("jsonwebtoken");
const User = require("../models/User");

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "7d" });

// POST /api/auth/register
const register = async (req, res) => {
  try {
    const { name, email, password, role, team } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ success: false, message: "Name, email, password, and role are required." });
    }

    // Nobody can register as admin — admin is hardcoded
    if (role === "admin") {
      return res.status(403).json({ success: false, message: "Admin account cannot be created via registration." });
    }

    const needsTeam = !["admin", "sub_admin"].includes(role);
    if (needsTeam && !team) {
      return res.status(400).json({ success: false, message: "Team is required for your role." });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ success: false, message: "An account with this email already exists." });
    }

    const user = await User.create({
      name, email, password, role,
      team: needsTeam ? team : null,
    });

    const token = generateToken(user._id);
    res.status(201).json({ success: true, message: "Account created successfully!", token, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required." });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
    if (!user) return res.status(401).json({ success: false, message: "Invalid email or password." });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ success: false, message: "Invalid email or password." });

    if (!user.isActive) return res.status(401).json({ success: false, message: "Account deactivated. Contact admin." });

    const token = generateToken(user._id);
    res.json({ success: true, message: "Logged in successfully!", token, user: user.toJSON() });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/auth/me
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { register, login, getMe };
