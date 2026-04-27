const mongoose = require("mongoose");

const specialDaySchema = new mongoose.Schema(
  {
    date: {
      type: String,
      required: [true, "Date is required"],
      match: [/^\d{2}-\d{2}$/, "Date must be in MM-DD format"],
      index: true,
    },
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true }
);

// Compound index for fast date lookups
specialDaySchema.index({ date: 1 });

module.exports = mongoose.model("SpecialDay", specialDaySchema);
