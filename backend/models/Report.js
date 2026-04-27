const mongoose = require("mongoose");

// Using Mixed type for work entries = unstructured / flexible data
// Each user can store freeform work data however they like

const reportSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    date: {
      type: String, // stored as "YYYY-MM-DD" string for easy daily lookup
      required: true,
    },

    // UNSTRUCTURED work data - can be any shape the user/app sends
    // Examples:
    //   { summary: "...", tasks: [...], blockers: "..." }
    //   { content: "plain text", hoursWorked: 6 }
    //   { bullets: ["did X", "fixed Y"], meetings: ["standup"] }
    workData: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
      default: {},
    },

    // Mood of the day
    mood: {
      type: String,
      enum: ["great", "good", "neutral", "tough"],
      default: "good",
    },

    // Quick plain-text summary (always present for display)
    summary: {
      type: String,
      required: [true, "Summary of today's work is required"],
      trim: true,
    },
  },
  {
    timestamps: true,
    // Allow storing any extra fields not defined in schema
    strict: false,
  }
);

// Compound index: one report per user per day
reportSchema.index({ user: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("Report", reportSchema);
