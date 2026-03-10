const router = require("express").Router();
const User = require("../models/User");
const { requireAuth, requireAdmin } = require("../middleware/auth");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const bcrypt = require("bcryptjs");

// --- Avatar upload (stored on disk; served only to the owner via auth route) ---
const AVATAR_DIR = path.join(__dirname, "..", "uploads", "avatars");
if (!fs.existsSync(AVATAR_DIR)) fs.mkdirSync(AVATAR_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, AVATAR_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || "").slice(0, 10) || ".png";
    cb(null, `${req.user.userId}-${Date.now()}${ext}`);
  },
});

const uploadAvatar = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (req, file, cb) => {
    if (!file.mimetype || !file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed"));
    }
    cb(null, true);
  },
});

// ✅ Current user (now includes profile fields)
router.get("/me", requireAuth, async (req, res) => {
  try {
    const me = await User.findById(req.user.userId).select(
      "email role createdAt name bio notifications avatarFilename"
    );
    if (!me) return res.status(404).json({ message: "User not found" });

    res.json({
      id: String(me._id),
      email: me.email,
      role: me.role,
      createdAt: me.createdAt,
      name: me.name || "",
      bio: me.bio || "",
      notifications: typeof me.notifications === "boolean" ? me.notifications : true,
      hasAvatar: Boolean(me.avatarFilename),
    });
  } catch (err) {
    console.error("Get me error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Update current user profile fields (writes to DB)
router.patch("/me", requireAuth, async (req, res) => {
  try {
    const { name, bio, notifications } = req.body || {};

    const updates = {};
    if (typeof name === "string") updates.name = name.trim().slice(0, 80);
    if (typeof bio === "string") updates.bio = bio.trim().slice(0, 500);
    if (typeof notifications === "boolean") updates.notifications = notifications;

    const me = await User.findByIdAndUpdate(req.user.userId, { $set: updates }, { new: true })
      .select("email role createdAt name bio notifications avatarFilename");

    if (!me) return res.status(404).json({ message: "User not found" });

    res.json({
      id: String(me._id),
      email: me.email,
      role: me.role,
      createdAt: me.createdAt,
      name: me.name || "",
      bio: me.bio || "",
      notifications: typeof me.notifications === "boolean" ? me.notifications : true,
      hasAvatar: Boolean(me.avatarFilename),
    });
  } catch (err) {
    console.error("Patch me error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Upload avatar (image) for current user (writes filename to DB)
router.post("/me/avatar", requireAuth, (req, res) => {
  uploadAvatar.single("avatar")(req, res, async (err) => {
    try {
      if (err) return res.status(400).json({ message: err.message || "Upload failed" });
      if (!req.file) return res.status(400).json({ message: "No file uploaded" });

      const me = await User.findById(req.user.userId).select("avatarFilename");
      if (!me) return res.status(404).json({ message: "User not found" });

      // delete old avatar file if exists
      if (me.avatarFilename) {
        const oldPath = path.join(AVATAR_DIR, me.avatarFilename);
        if (fs.existsSync(oldPath)) {
          try { fs.unlinkSync(oldPath); } catch (_) {}
        }
      }

      me.avatarFilename = req.file.filename;
      await me.save();

      res.json({ ok: true });
    } catch (e) {
      console.error("Upload avatar error:", e);
      res.status(500).json({ message: "Server error" });
    }
  });
});

// ✅ Serve avatar bytes ONLY to the logged-in user
router.get("/me/avatar", requireAuth, async (req, res) => {
  try {
    const me = await User.findById(req.user.userId).select("avatarFilename");
    if (!me || !me.avatarFilename) return res.status(404).json({ message: "No avatar" });

    const filePath = path.join(AVATAR_DIR, me.avatarFilename);
    if (!fs.existsSync(filePath)) return res.status(404).json({ message: "No avatar" });

    res.setHeader("Cache-Control", "private, max-age=86400");
    return res.sendFile(filePath);
  } catch (err) {
    console.error("Get avatar error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Update password
router.patch("/me/password", requireAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Both current and new password are required" });
    }

    const me = await User.findById(req.user.userId);
    if (!me) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(currentPassword, me.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ message: "Incorrect current password" });
    }

    me.passwordHash = await bcrypt.hash(newPassword, 10);
    await me.save();
    
    res.json({ message: "Password updated successfully" });
  } catch (err) {
    console.error("Update password error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Delete Account
router.delete("/me", requireAuth, async (req, res) => {
  try {
    const me = await User.findById(req.user.userId);
    if (!me) return res.status(404).json({ message: "User not found" });

    // delete avatar file if exists
    if (me.avatarFilename) {
      const oldPath = path.join(AVATAR_DIR, me.avatarFilename);
      if (fs.existsSync(oldPath)) {
        try { fs.unlinkSync(oldPath); } catch (_) {}
      }
    }

    await User.findByIdAndDelete(req.user.userId);
    res.json({ message: "Account deleted successfully" });
  } catch (err) {
    console.error("Delete account error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Admin: list users (unchanged)
router.get("/admin/all", requireAuth, requireAdmin, async (req, res) => {
  try {
    const users = await User.find().select("email role createdAt").sort({ createdAt: -1 });
    res.json(users.map((u) => ({ id: String(u._id), email: u.email, role: u.role, createdAt: u.createdAt })));
  } catch (err) {
    console.error("Admin list users error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;