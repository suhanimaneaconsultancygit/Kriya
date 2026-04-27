const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/\S+@\S+\.\S+/, "Please enter a valid email"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
    },

    // ROLE HIERARCHY:
    // admin (was ceo) > sub_admin (was manager) > team_lead > member > intern
    role: {
      type: String,
      enum: ["admin", "sub_admin", "team_lead", "member", "intern"],
      default: "intern",
    },

    team: {
      type: String,
      enum: ["Web Development", "Marketing", "Designing", "Interns", "SEO", "AI Quality", null],
      default: null,
    },

    avatar: { type: String },

    isActive: { type: Boolean, default: true },

    // flag to protect the hardcoded admin from deletion / role change
    isSystemAdmin: { type: Boolean, default: false },

    // ─── WHATSAPP NOTIFICATION SETTINGS ────────────────────────────────────
    phoneNumber:   { type: String, default: null },
    whatsappOptIn: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Auto-generate avatar initials before saving
userSchema.pre("save", async function (next) {
  if (this.isModified("name")) {
    this.avatar = this.name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }
  if (this.isModified("password")) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  return user;
};

userSchema.statics.getRoleRank = function (role) {
  const ranks = { admin: 5, sub_admin: 4, team_lead: 3, member: 2, intern: 1 };
  return ranks[role] || 0;
};

module.exports = mongoose.model("User", userSchema);
