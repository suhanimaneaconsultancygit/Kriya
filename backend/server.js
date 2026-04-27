const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

// ─── VALIDATE ENV VARS FIRST ──────────────────────────────────────────────────
if (!process.env.MONGO_URI) {
  console.error("❌ MONGO_URI is missing from your .env file!");
  console.error("   Make sure your .env file exists in the backend/ folder.");
  process.exit(1);
}
if (!process.env.JWT_SECRET) {
  console.error("❌ JWT_SECRET is missing from your .env file!");
  process.exit(1);
}

console.log("🔍 Connecting to MongoDB Atlas...");
console.log("   URI starts with:", process.env.MONGO_URI.slice(0, 40) + "...");

const app = express();

// ─── MIDDLEWARE ───────────────────────────────────────────────────────────────
app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:5173"],
  credentials: true,
}));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// ─── ROUTES ───────────────────────────────────────────────────────────────────
app.use("/api/auth",    require("./routes/authRoutes"));
app.use("/api/users",   require("./routes/userRoutes"));
app.use("/api/tasks",   require("./routes/taskRoutes"));
app.use("/api/notifications", require("./routes/notificationRoutes"));
app.use("/api/reports",      require("./routes/reportRoutes"));
app.use("/api/special-days", require("./routes/specialDayRoutes"));

// ─── HEALTH CHECK ─────────────────────────────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "TaskFlow API is running",
    db: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    time: new Date(),
  });
});

// ─── ERROR HANDLER ────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error("Server Error:", err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

// ─── CONNECT TO MONGODB ATLAS ─────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 10000, // wait 10s before giving up
    socketTimeoutMS: 45000,
  })
  .then(() => {
    console.log("✅ MongoDB Atlas connected successfully!");
    console.log("   Database: taskflow");
    app.listen(PORT, () => {
      console.log(`🚀 TaskFlow Server running on http://localhost:${PORT}`);
      console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
    });
  })
  .catch((err) => {
    console.error("\n❌ MongoDB connection failed!");
    console.error("   Error:", err.message);
    console.error("\n🔧 Common fixes:");
    console.error("   1. Check your MONGO_URI in the .env file");
    console.error("   2. Go to MongoDB Atlas → Network Access → Add your IP address (or 0.0.0.0/0 for all)");
    console.error("   3. Make sure your Atlas username/password are correct");
    console.error("   4. Check your internet connection");
    process.exit(1);
  });
