const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Task title is required"],
      trim: true,
    },

    description: {
      type: String,
      trim: true,
      default: "",
    },

    // Voice note: stored as base64 data URL or a URL string
    voiceNote: {
      type: String,
      default: null,
    },
    voiceNoteDuration: {
      type: Number, // seconds
      default: null,
    },

    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Task must be assigned to someone"],
    },

    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Reassignment history
    reassignmentHistory: [
      {
        fromUser:     { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        toUser:       { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        reassignedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        reassignedAt: { type: Date, default: Date.now },
        note:         String,
      },
    ],

    team: {
      type: String,
      enum: ["Web Development", "Marketing", "Designing", "Interns", "SEO", "AI Quality"],
      required: [true, "Team is required"],
    },

    status: {
      type: String,
      enum: ["todo", "in_progress", "review", "done", "blocked"],
      default: "todo",
    },

    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },

    dueDate: {
      type: Date,
      required: [true, "Due date is required"],
    },

    // Status change history
    statusHistory: [
      {
        status:    String,
        changedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        changedAt: { type: Date, default: Date.now },
        note:      String,
      },
    ],
  },
  { timestamps: true }
);

taskSchema.index({ assignedTo: 1 });
taskSchema.index({ assignedBy: 1 });
taskSchema.index({ team: 1 });
taskSchema.index({ status: 1 });

module.exports = mongoose.model("Task", taskSchema);
