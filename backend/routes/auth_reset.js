const router = require("express").Router();
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

// helpers
const hash = (v) => crypto.createHash("sha256").update(String(v)).digest("hex");
const randomOtp = () => String(Math.floor(100000 + Math.random() * 900000)); // 6-digit
const randomToken = () => crypto.randomBytes(32).toString("hex");

// POST /api/auth/forgot-password
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ message: "Email required" });

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    // Always return ok to avoid account enumeration
    if (!user) return res.json({ ok: true });

    const otp = randomOtp();
    user.resetOtpHash = hash(otp);
    user.resetOtpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins
    user.resetTokenHash = null;
    user.resetTokenExpiresAt = null;
    await user.save();

    // Return otp ONLY for development testing if you want:
    // res.json({ ok: true, devOtp: otp });

    // Production:
    res.json({ ok: true, otp, name: user.name || "User", email: user.email }); 
    // We return otp so frontend can EmailJS-send it. (If you want stricter security, do email sending server-side instead.)
  } catch (e) {
    console.error("forgot-password error:", e);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/auth/verify-otp
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body || {};
    if (!email || !otp) return res.status(400).json({ message: "Email and OTP required" });

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user || !user.resetOtpHash || !user.resetOtpExpiresAt) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (user.resetOtpExpiresAt.getTime() < Date.now()) {
      return res.status(400).json({ message: "OTP expired" });
    }

    if (hash(otp) !== user.resetOtpHash) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    const resetToken = randomToken();
    user.resetTokenHash = hash(resetToken);
    user.resetTokenExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins
    user.resetOtpHash = null;
    user.resetOtpExpiresAt = null;
    await user.save();

    res.json({ ok: true, resetToken });
  } catch (e) {
    console.error("verify-otp error:", e);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/auth/reset-password
router.post("/reset-password", async (req, res) => {
  try {
    const { email, resetToken, newPassword } = req.body || {};
    if (!email || !resetToken || !newPassword) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user || !user.resetTokenHash || !user.resetTokenExpiresAt) {
      return res.status(400).json({ message: "Invalid reset request" });
    }

    if (user.resetTokenExpiresAt.getTime() < Date.now()) {
      return res.status(400).json({ message: "Reset token expired" });
    }

    if (hash(resetToken) !== user.resetTokenHash) {
      return res.status(400).json({ message: "Invalid reset token" });
    }

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, 10); // adjust if your field is passwordHash
    user.resetTokenHash = null;
    user.resetTokenExpiresAt = null;
    await user.save();

    res.json({ ok: true });
  } catch (e) {
    console.error("reset-password error:", e);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;