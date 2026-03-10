const router = require("express").Router();
const Event = require("../models/Event");
const mapEvent = require("../utils/mapEvent");
const AuditLog = require("../models/AuditLog");
const Notification = require("../models/Notification");
const User = require("../models/User");
const { requireAuth, requireAdmin } = require("../middleware/auth");
const mongoose = require("mongoose");
// Admin: list all events (pending/approved/rejected/deleted)
router.get("/events", requireAuth, requireAdmin, async (req, res) => {
  try {
    const events = await Event.find()
      .populate("createdBy", "name email role")
      .populate("reviewedBy", "name email role")
      .sort({ createdAt: -1 });

    res.json(events.map(mapEvent));
  } catch (err) {
    console.error("Admin list events error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Admin: approve/reject/delete/pending
router.patch("/events/:id/status", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { status, rejectReason } = req.body || {};
    const allowed = ["approved", "rejected", "deleted", "pending"];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const ev = await Event.findById(req.params.id);
    if (!ev) return res.status(404).json({ message: "Not found" });

    ev.status = status;
    ev.reviewedBy = req.user.userId;
    ev.reviewedAt = new Date();

    if (status === "rejected") {
      ev.rejectReason = String(rejectReason || "").trim();
    } else {
      // clear old rejection note when approving/pending/deleting
      ev.rejectReason = "";
    }

    ev.statusHistory = Array.isArray(ev.statusHistory) ? ev.statusHistory : [];
    ev.statusHistory.push({
      status,
      by: req.user.userId,
      at: new Date(),
      note: status === "rejected" ? String(rejectReason || "").trim() : "",
    });

    const saved = await ev.save();
    
    // Dispatch Notifications if just approved
    if (status === "approved") {
      try {
        const users = await User.find({}, "_id");
        const notifications = [];
        
        for (const user of users) {
          const isCreator = ev.createdBy && user._id.toString() === ev.createdBy.toString();
          
          if (isCreator) {
            notifications.push({
              userId: user._id,
              type: "HOST_SUCCESS",
              title: "Successfully Hosted",
              message: `Your event "${ev.title}" has been successfully hosted and approved by the admin!`,
              meta: { eventId: ev._id, eventTitle: ev.title }
            });
          } else {
            notifications.push({
              userId: user._id,
              type: "NEW_EVENT",
              title: "New Event Added",
              message: `A new event "${ev.title}" has just been added!`,
              meta: { eventId: ev._id, eventTitle: ev.title }
            });
          }
        }
        
        await Notification.insertMany(notifications);
      } catch (err) {
        console.error("Failed to insert approval notifications:", err);
      }
    }

    await AuditLog.create({
  actorId: req.user.userId,
  action: `EVENT_${status.toUpperCase()}`,
  targetType: "event",
  targetId: ev._id,
  metadata: {
    oldStatus: ev.status,
    rejectReason: status === "rejected" ? rejectReason : "",
  },
});
    await saved.populate("createdBy", "name email role");
    await saved.populate("reviewedBy", "name email role");

    res.json(mapEvent(saved));
  } catch (err) {
    console.error("Admin update status error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/analytics", requireAuth, requireAdmin, async (req, res) => {
  try {
    const totalRevenueResult = await mongoose.model("Booking").aggregate([
      { $match: { status: "PAID" } },
      { $group: { _id: null, totalSales: { $sum: "$total" }, tickets: { $sum: "$qty" } } }
    ]);

    const topCategories = await mongoose.model("Booking").aggregate([
      { $match: { status: "PAID" } },
      { $group: { _id: "$category", tickets: { $sum: "$qty" }, revenue: { $sum: "$total" } } },
      { $sort: { tickets: -1 } },
      { $limit: 5 }
    ]);

    const bookingPressure = await Event.aggregate([
      {
        $project: {
          title: 1,
          capacity: 1,
          booked: 1,
          pressure: {
            $cond: [
              { $gt: ["$capacity", 0] },
              { $divide: ["$booked", "$capacity"] },
              0
            ]
          }
        }
      },
      { $sort: { pressure: -1 } },
      { $limit: 5 }
    ]);

    // Attendee behavioral patterns (overall platform booking trend)
    const attendeeBehavior = await mongoose.model("Booking").aggregate([
      { $match: { status: "PAID" } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          tickets: { $sum: "$qty" },
          revenue: { $sum: "$total" }
        }
      },
      { $sort: { _id: 1 } },
      { $limit: 30 } // last 30 days
    ]);

    const totalSales = totalRevenueResult[0]?.totalSales || 0;
    const adminRevenue = totalSales * 0.05; // 5% flat fee goes to Admin
    const hostRevenue = totalSales - adminRevenue; 

    res.json({
      totalSales,
      adminRevenue, 
      hostRevenue,
      ticketsTotal: totalRevenueResult[0]?.tickets || 0,
      topCategories,
      bookingPressure,
      attendeeBehavior: attendeeBehavior.map(b => ({ date: b._id, tickets: b.tickets, revenue: b.revenue }))
    });

  } catch (err) {
    console.error("Analytics error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
