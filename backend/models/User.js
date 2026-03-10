const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    // Profile
    name: { type: String, default: "" },
    bio: { type: String, default: "" },
    notifications: { type: Boolean, default: true },

    // Stored on disk; served ONLY via an auth-protected route
    avatarFilename: { type: String, default: null },

    email: { type: String, unique: true, required: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, default: "user" }, // user | admin

    resetOtpHash: { type: String, default: null },
    resetOtpExpiresAt: { type: Date, default: null },
    resetTokenHash: { type: String, default: null },
    resetTokenExpiresAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);