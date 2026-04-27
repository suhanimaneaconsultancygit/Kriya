const jwt = require("jsonwebtoken");
const User = require("../models/User");

// updated rank table: admin / sub_admin replace ceo / manager
const ROLE_RANK = { admin: 5, sub_admin: 4, team_lead: 3, member: 2, intern: 1 };

const protect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    }
    if (!token) {
      return res.status(401).json({ success: false, message: "Not authorized. Please log in." });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");
    if (!user) return res.status(401).json({ success: false, message: "User no longer exists." });
    if (!user.isActive) return res.status(401).json({ success: false, message: "Account deactivated." });
    req.user = user;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") return res.status(401).json({ success: false, message: "Invalid token." });
    if (error.name === "TokenExpiredError") return res.status(401).json({ success: false, message: "Token expired. Please log in again." });
    next(error);
  }
};

const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ success: false, message: `Access denied. Required: ${roles.join(" or ")}` });
  }
  next();
};

const requireMinRole = (minRole) => (req, res, next) => {
  if (ROLE_RANK[req.user.role] < ROLE_RANK[minRole]) {
    return res.status(403).json({ success: false, message: `Requires ${minRole} or higher.` });
  }
  next();
};

module.exports = { protect, requireRole, requireMinRole, ROLE_RANK };
