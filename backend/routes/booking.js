const router = require("express").Router();
const mongoose = require("mongoose");
const { requireAuth, requireAdmin } = require("../middleware/auth");
const Event = require("../models/Event");
const Booking = require("../models/Booking");
const Notification = require("../models/Notification");
const AuditLog = require("../models/AuditLog");

// ✅ IMPORTANT: register schemas before mongoose.model(...)

// helper: generate a simple bookingId
function makeBookingId() {
  return "EVT-" + Math.random().toString(36).slice(2, 7).toUpperCase();
}

// ✅ Create booking (backend-enforced seat reservation)
// ✅ Create booking (backend-enforced seat reservation)
router.post("/", requireAuth, async (req, res) => {
  try {
    const { eventId, qty, unitPrice } = req.body || {};

    const Q = Math.max(1, Number(qty || 1));
    const P = Number(unitPrice || 0);

    if (!eventId) return res.status(400).json({ message: "Missing eventId" });

    if (!mongoose.isValidObjectId(eventId)) {
      return res.status(400).json({ message: "Invalid eventId" });
    }

    // Fetch event
    const ev = await Event.findById(eventId);
    if (!ev) return res.status(404).json({ message: "Event not found" });
    if (ev.status !== "approved") {
      return res.status(403).json({ message: "Event not available for booking" });
    }

    const currentBooked = ev.booked || 0;
    const capacity = ev.capacity || 200;

    if (currentBooked + Q > capacity) {
      return res.status(409).json({ message: "Seats just sold out. Try again." });
    }

    // 🔥 Ultra-safe seat lock (prevents strict query failing on old data)
    const updated = await Event.findOneAndUpdate(
      { _id: ev._id, status: "approved" },
      { $inc: { booked: Q } },
      { new: true }
    );

    if (!updated) {
      return res.status(409).json({ message: "Booking conflict. Try again." });
    }

    const total = (Number.isFinite(P) ? P : 0) * Q;

    // ✅ Save booking + snapshot for dashboard
    const booking = await Booking.create({
      bookingId: makeBookingId(),
      userId: req.user.userId,
      eventId: updated._id,

      // snapshot (dashboard friendly)
      title: updated.title,
      date: updated.date,
      location: updated.location || "",
      category: updated.category || "Event",
      image: updated.image || "",
      price: updated.price || "Free",

      qty: Q,
      unitPrice: Number.isFinite(P) ? P : 0,
      total,
      status: "PAID",
    });

    // ✅ Audit log AFTER booking exists
    await AuditLog.create({
      actorId: req.user.userId,
      action: "BOOKING_CREATED",
      targetType: "booking",
      targetId: booking._id,
      metadata: {
        eventId: updated._id,
        qty: Q,
        total,
      },
    });

    await Notification.create({
      userId: req.user.userId,
      type: "BOOKING_CONFIRMED",
      title: "Successfully Booked",
      message: `You have successfully booked "${updated.title}". Ticket: ${booking.bookingId}`,
      meta: {
        bookingId: booking._id,
        bookingCode: booking.bookingId,
        eventId: updated._id,
        eventTitle: updated.title,
        eventDate: updated.date,
      },
    });

    return res.json({
      ok: true,
      booking,
      event: { _id: updated._id, booked: updated.booked, capacity: updated.capacity },
    });
  } catch (err) {
    console.error("Create booking error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ✅ My bookings (Dashboard)
router.get("/me", requireAuth, async (req, res) => {
  try {
    const list = await Booking.find({ userId: req.user.userId })
      .populate("eventId", "status")
      .sort({ createdAt: -1 });

    // Filter out bookings where the event has been deleted (soft or hard)
    const validBookings = list.filter((b) => {
      if (!b.eventId) return false; // hard deleted
      if (b.eventId.status === "deleted") return false; // soft deleted
      return true;
    }).map((b) => {
      // Convert eventId back to just the ID to prevent breaking frontend code
      const doc = b.toObject ? b.toObject() : b;
      return {
        ...doc,
        eventId: doc.eventId._id || doc.eventId
      };
    });

    res.json(validBookings);
  } catch (err) {
    console.error("Fetch my bookings error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ✅ Admin: all bookings
router.get("/admin/all", requireAuth, requireAdmin, async (req, res) => {
  try {
    const list = await Booking.find()
      .sort({ createdAt: -1 })
      .populate("userId", "email role")
      .populate("eventId", "title date status");

    res.json(list);
  } catch (err) {
    console.error("Admin list bookings error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ✅ Cancel booking (releases seats)
// ✅ Cancel booking (releases seats)
router.post("/:id/cancel", requireAuth, async (req, res) => {
  try {
    const id = req.params.id;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid booking id" });
    }

    const booking = await Booking.findOne({ _id: id, userId: req.user.userId });
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    // If already cancelled, return as-is (no duplicate notifications/logs)
    if (booking.status === "CANCELLED") {
      return res.json({ ok: true, booking });
    }

    // Mark cancelled
    booking.status = "CANCELLED";
    booking.cancelledAt = new Date();
    await booking.save();

    // Release seats back to event (safe guard)
    await Event.findOneAndUpdate(
      { _id: booking.eventId, booked: { $gte: booking.qty } },
      { $inc: { booked: -booking.qty } }
    );

    // ✅ Audit log for cancellation (non-breaking addition)
    await AuditLog.create({
      actorId: req.user.userId,
      action: "BOOKING_CANCELLED",
      targetType: "booking",
      targetId: booking._id,
      metadata: {
        eventId: booking.eventId,
        qty: booking.qty,
        bookingId: booking.bookingId,
      },
    });

    // ✅ Notification for cancellation (non-breaking addition)
    await Notification.create({
      userId: req.user.userId,
      type: "BOOKING_CANCELLED",
      title: "Booking Cancelled",
      message: `Your booking for "${booking.title}" has been cancelled.`,
      meta: {
        bookingId: booking._id,
        bookingCode: booking.bookingId,
        eventId: booking.eventId,
        eventTitle: booking.title,
        eventDate: booking.date,
      },
    });

    return res.json({ ok: true, booking });
  } catch (err) {
    console.error("Cancel booking error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = router;