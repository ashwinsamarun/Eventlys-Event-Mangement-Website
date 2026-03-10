const router = require("express").Router();
const mongoose = require("mongoose");
const { requireAuth } = require("../middleware/auth");
const Notification = require("../models/Notification");

// GET /api/notifications/me?unreadOnly=true&limit=20
router.get("/me", requireAuth, async (req, res) => {
  try {
    const unreadOnly = String(req.query.unreadOnly || "false") === "true";
    const limit = Math.min(50, Math.max(1, Number(req.query.limit || 20)));

    const q = { userId: new mongoose.Types.ObjectId(req.user.userId) };
    if (unreadOnly) q.read = false;

    const list = await Notification.find(q)
      .sort({ createdAt: -1 })
      .limit(limit);

    res.json(list);
  } catch (e) {
    console.error("notifications me error:", e);
    res.status(500).json({ message: "Server error" });
  }
});

// GET unread count
router.get("/unread-count", requireAuth, async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      userId: new mongoose.Types.ObjectId(req.user.userId),
      read: false,
    });

    res.json({ count });
  } catch (e) {
    console.error("unread-count error:", e);
    res.status(500).json({ message: "Server error" });
  }
});

// Mark one as read
router.patch("/:id/read", requireAuth, async (req, res) => {
  try {
    const id = req.params.id;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid notification id" });
    }

    const updated = await Notification.findOneAndUpdate(
      {
        _id: id,
        userId: new mongoose.Types.ObjectId(req.user.userId),
      },
      { $set: { read: true } },
      { new: true }
    );

    if (!updated) return res.status(404).json({ message: "Not found" });

    res.json(updated);
  } catch (e) {
    console.error("mark read error:", e);
    res.status(500).json({ message: "Server error" });
  }
});

// Mark all as read
router.post("/mark-all-read", requireAuth, async (req, res) => {
  try {
    await Notification.updateMany(
      {
        userId: new mongoose.Types.ObjectId(req.user.userId),
        read: false,
      },
      { $set: { read: true } }
    );

    res.json({ ok: true });
  } catch (e) {
    console.error("mark all read error:", e);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;