const router = require("express").Router();
const Event = require("../models/Event");
const mapEvent = require("../utils/mapEvent");
const { requireAuth, requireAdmin } = require("../middleware/auth");
const jwt = require("jsonwebtoken");
const path = require("path");
const fs = require("fs");
const multer = require("multer");

const EVENT_IMG_DIR = path.join(__dirname, "..", "uploads", "events");
if (!fs.existsSync(EVENT_IMG_DIR)) fs.mkdirSync(EVENT_IMG_DIR, { recursive: true });

const storageImg = multer.diskStorage({
  destination: (req, file, cb) => cb(null, EVENT_IMG_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || "").slice(0, 10) || ".png";
    cb(null, `event-${Date.now()}-${Math.round(Math.random() * 1000)}${ext}`);
  },
});

const uploadEventImg = multer({
  storage: storageImg,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (!file.mimetype || !file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed"));
    }
    cb(null, true);
  },
});

function parseISODate(val) {
  if (!val) return null;
  const d = new Date(val);
  return Number.isNaN(d.getTime()) ? null : d;
}

function toArray(val) {
  if (!val) return [];
  if (Array.isArray(val)) return val.filter(Boolean);
  if (typeof val === "string") {
    return val
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

function isOwnerOrAdmin(req, ev) {
  return req.user?.role === "admin" || String(ev.createdBy) === String(req.user?.userId);
}

function tryAttachUser(req) {
  // Optional auth: if a Bearer token exists, decode it; otherwise ignore.
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) return;
  const token = header.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { userId: decoded.userId, role: decoded.role };
  } catch {
    // ignore invalid token for public endpoints
  }
}

/* =========================
   ADMIN ROUTES (MUST COME FIRST)
========================= */

// Admin: list all
router.get("/admin/all/list", requireAuth, requireAdmin, async (req, res) => {
  try {
    const events = await Event.find().sort({ createdAt: -1 });
    res.json(events.map(mapEvent));
  } catch (err) {
    console.error("Admin list events error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Admin: approve/reject/delete/pending
router.patch("/:id/status", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ["approved", "rejected", "deleted", "pending", "delete_requested"];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    if (status === "deleted") {
      const ev = await Event.findByIdAndDelete(req.params.id);
      if (!ev) return res.status(404).json({ message: "Not found" });
      return res.json(mapEvent(ev));
    }

    // Attempting to reject a delete request logically reverts it to 'approved' or its previous functional state
    let finalStatus = status;
    const currentEv = await Event.findById(req.params.id);
    if (!currentEv) return res.status(404).json({ message: "Not found" });

    if (status === "rejected" && currentEv.status === "delete_requested") {
      finalStatus = "approved"; // User's event stays approved/live
    }

    const ev = await Event.findByIdAndUpdate(req.params.id, { status: finalStatus }, { new: true });
    res.json(mapEvent(ev));
  } catch (err) {
    console.error("Admin update status error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* =========================
   USER ROUTES
========================= */

// User: list my events (any status)
router.get("/me", requireAuth, async (req, res) => {
  try {
    const events = await Event.find({ createdBy: req.user.userId }).sort({ createdAt: -1 });
    res.json(events.map(mapEvent));
  } catch (err) {
    console.error("List my events error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// User: analytics for my hosted events
router.get("/my-analytics", requireAuth, async (req, res) => {
  try {
    const mongoose = require("mongoose");
    const userId = new mongoose.Types.ObjectId(req.user.userId);
    
    // Total revenue & tickets for user's events (minus admin fee 5%)
    const stats = await mongoose.model("Booking").aggregate([
      { $match: { status: "PAID" } },
      {
        $lookup: {
          from: "events",
          localField: "eventId",
          foreignField: "_id",
          as: "eventDetails"
        }
      },
      { $unwind: "$eventDetails" },
      { $match: { "eventDetails.createdBy": userId } },
      {
        $group: {
          _id: null,
          totalSales: { $sum: "$total" },
          ticketsSold: { $sum: "$qty" }
        }
      }
    ]);

    // Tickets sold per event (for bar chart)
    const eventPerformance = await mongoose.model("Booking").aggregate([
      { $match: { status: "PAID" } },
      {
        $lookup: {
          from: "events",
          localField: "eventId",
          foreignField: "_id",
          as: "eventDetails"
        }
      },
      { $unwind: "$eventDetails" },
      { $match: { "eventDetails.createdBy": userId } },
      {
        $group: {
          _id: "$eventDetails.title",
          id: { $first: "$eventDetails._id" },
          ticketsSold: { $sum: "$qty" },
          revenue: { $sum: "$total" }
        }
      },
      { $sort: { ticketsSold: -1 } },
      { $limit: 10 }
    ]);

    // Attendee behavioral patterns (booking trend over time)
    const bookingTrends = await mongoose.model("Booking").aggregate([
      { $match: { status: "PAID" } },
      {
        $lookup: {
          from: "events",
          localField: "eventId",
          foreignField: "_id",
          as: "eventDetails"
        }
      },
      { $unwind: "$eventDetails" },
      { $match: { "eventDetails.createdBy": userId } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          tickets: { $sum: "$qty" }
        }
      },
      { $sort: { _id: 1 } },
      { $limit: 30 } // last 30 days of activity
    ]);

    res.json({
      totalSales: stats[0]?.totalSales || 0,
      netRevenue: (stats[0]?.totalSales || 0) * 0.95, // 95% goes to host
      ticketsSold: stats[0]?.ticketsSold || 0,
      eventPerformance: eventPerformance.map(e => ({ name: e._id, tickets: e.ticketsSold, revenue: e.revenue })),
      bookingTrends: bookingTrends.map(b => ({ date: b._id, tickets: b.tickets }))
    });

  } catch (err) {
    console.error("Host analytics error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* =========================
   PUBLIC ROUTES
========================= */

// Public: categories for filtering
router.get("/categories", async (req, res) => {
  try {
    const categories = await Event.distinct("category", { status: "approved" });
    res.json(categories.filter(Boolean).sort());
  } catch (err) {
    console.error("List categories error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Public: approved events
router.get("/", async (req, res) => {
  try {
    const {
      q,
      category,
      dateFrom,
      dateTo,
      page = "1",
      limit = "20",
      sort = "startAt",
      order = "asc",
      meta,
    } = req.query;

    const filter = { status: "approved" };

    if (category) filter.category = category;

    const from = parseISODate(dateFrom);
    const to = parseISODate(dateTo);
    if (from || to) {
      filter.$or = [{ startAt: {} }, { date: {} }];
      if (from) {
        filter.$or[0].startAt.$gte = from;
        filter.$or[1].date.$gte = from;
      }
      if (to) {
        filter.$or[0].startAt.$lte = to;
        filter.$or[1].date.$lte = to;
      }
    }

    let query = Event.find(filter);

    if (q) {
      query = query.find({ $text: { $search: String(q) } });
    }

    const safeLimit = Math.max(1, Math.min(100, Number(limit) || 20));
    const safePage = Math.max(1, Number(page) || 1);
    const skip = (safePage - 1) * safeLimit;

    const sortField = ["startAt", "date", "createdAt"].includes(String(sort)) ? String(sort) : "startAt";
    const sortDir = String(order).toLowerCase() === "desc" ? -1 : 1;

    const [items, total] = await Promise.all([
      query
        .sort({ [sortField]: sortDir })
        .skip(skip)
        .limit(safeLimit),
      Event.countDocuments(q ? { ...filter, $text: { $search: String(q) } } : filter),
    ]);

    const mapped = items.map(mapEvent);

    // Backward compatible default: return an array.
    // If meta=1, return { items, page, limit, total }.
    if (String(meta) === "1") {
      return res.json({ items: mapped, page: safePage, limit: safeLimit, total });
    }

    res.json(mapped);
  } catch (err) {
    console.error("Public list events error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Public: single approved event
router.get("/:id", async (req, res) => {
  try {
    tryAttachUser(req);

    // If user is authenticated, allow viewing own pending/rejected events.
    const baseFilter = { _id: req.params.id };
    let ev = await Event.findOne({ ...baseFilter, status: "approved" });

    if (!ev && req.user) {
      const candidate = await Event.findById(req.params.id);
      if (candidate && isOwnerOrAdmin(req, candidate) && candidate.status !== "deleted") {
        ev = candidate;
      }
    }

    if (!ev) return res.status(404).json({ message: "Not found" });
    res.json(mapEvent(ev));
  } catch (err) {
    console.error("Public get event error:", err);
    res.status(400).json({ message: "Invalid event id" });
  }
});

// User: upload event image
router.post("/upload-image", requireAuth, uploadEventImg.single("image"), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });
    res.json({ imageUrl: `/api/events/image/${req.file.filename}` });
  } catch (err) {
    console.error("Upload event image error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Public: serve event image
router.get("/image/:filename", (req, res) => {
  try {
    const filePath = path.join(EVENT_IMG_DIR, req.params.filename);
    if (!fs.existsSync(filePath)) return res.status(404).json({ message: "Not found" });
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.sendFile(filePath);
  } catch (err) {
    console.error("Serve event image error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// User: create event (pending)
router.post("/", requireAuth, async (req, res) => {
  try {
    const body = req.body || {};

    if (!body.title || !body.organizer || !body.date) {
      return res.status(400).json({ message: "title, organizer, and date are required" });
    }

    const date = parseISODate(body.date);
    if (!date) return res.status(400).json({ message: "Invalid date" });

    const startAt = parseISODate(body.startAt) || date;
    const endAt = parseISODate(body.endAt);

    const ticketTypes = Array.isArray(body.ticketTypes) ? body.ticketTypes : [];
    const normalizedTickets = ticketTypes
      .filter((t) => t && t.name)
      .map((t) => ({
        name: String(t.name).trim(),
        price: Number(t.price) || 0,
        currency: String(t.currency || "INR").trim(),
        quantity: Math.max(0, Number(t.quantity) || 0),
        sold: Math.max(0, Number(t.sold) || 0),
      }));

    const ev = await Event.create({
      title: body.title,
      organizer: body.organizer,
      description: body.description || "",
      date,
      time: body.time || "TBD",

      startAt,
      endAt: endAt || undefined,
      timezone: body.timezone || "Asia/Kolkata",
      category: body.category || "Other",
      location: body.location || "Venue TBA",
      price: body.price || "Free",

      venue: typeof body.venue === "object" && body.venue ? body.venue : {},
      isOnline: Boolean(body.isOnline),
      onlineUrl: body.onlineUrl || "",
      tags: toArray(body.tags),
      ticketTypes: normalizedTickets,
      img: body.img || body.image || "",
      image: body.image || body.img || "",
      gallery: Array.isArray(body.gallery) ? body.gallery.filter(Boolean) : [],
      capacity: Number(body.capacity) || 200,
      booked: 0,
      status: "pending",
      createdBy: req.user.userId,
    });

    res.json(mapEvent(ev));
  } catch (err) {
    console.error("Create event error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// User/Admin: update an event
// - Admin can update anything.
// - Owner can update only while event is pending/rejected.
router.patch("/:id", requireAuth, async (req, res) => {
  try {
    const ev = await Event.findById(req.params.id);
    if (!ev) return res.status(404).json({ message: "Not found" });

    if (!isOwnerOrAdmin(req, ev)) {
      return res.status(403).json({ message: "Not allowed" });
    }

    if (req.user.role !== "admin" && !["pending", "rejected"].includes(ev.status)) {
      return res.status(409).json({ message: "Approved events cannot be edited" });
    }

    const body = req.body || {};

    const nextDate = body.date != null ? parseISODate(body.date) : ev.date;
    if (!nextDate) return res.status(400).json({ message: "Invalid date" });

    const nextStartAt = body.startAt != null ? parseISODate(body.startAt) : ev.startAt;
    if (body.startAt != null && !nextStartAt) return res.status(400).json({ message: "Invalid startAt" });

    const nextEndAt = body.endAt != null ? parseISODate(body.endAt) : ev.endAt;
    if (body.endAt != null && !nextEndAt) return res.status(400).json({ message: "Invalid endAt" });

    const ticketTypes = body.ticketTypes != null ? (Array.isArray(body.ticketTypes) ? body.ticketTypes : []) : null;
    const normalizedTickets = ticketTypes
      ? ticketTypes
          .filter((t) => t && t.name)
          .map((t) => ({
            name: String(t.name).trim(),
            price: Number(t.price) || 0,
            currency: String(t.currency || "INR").trim(),
            quantity: Math.max(0, Number(t.quantity) || 0),
            sold: Math.max(0, Number(t.sold) || 0),
          }))
      : undefined;

    const patch = {
      title: body.title ?? ev.title,
      organizer: body.organizer ?? ev.organizer,
      description: body.description ?? ev.description,
      date: nextDate,
      time: body.time ?? ev.time,
      startAt: (body.startAt != null ? nextStartAt : ev.startAt) || nextDate,
      endAt: body.endAt != null ? nextEndAt : ev.endAt,
      timezone: body.timezone ?? ev.timezone,
      category: body.category ?? ev.category,
      location: body.location ?? ev.location,
      price: body.price ?? ev.price,

      venue: body.venue != null ? (typeof body.venue === "object" && body.venue ? body.venue : {}) : ev.venue,
      isOnline: body.isOnline != null ? Boolean(body.isOnline) : ev.isOnline,
      onlineUrl: body.onlineUrl ?? ev.onlineUrl,
      tags: body.tags != null ? toArray(body.tags) : ev.tags,
      ticketTypes: normalizedTickets ?? ev.ticketTypes,
      img: body.img ?? body.image ?? ev.img,
      image: body.image ?? body.img ?? ev.image,
      gallery: body.gallery != null ? (Array.isArray(body.gallery) ? body.gallery.filter(Boolean) : []) : ev.gallery,
      capacity: body.capacity != null ? Number(body.capacity) : ev.capacity,
    };

    // If owner edits after a rejection, bring it back to pending for review
    if (req.user.role !== "admin" && ev.status === "rejected") {
      patch.status = "pending";
    }

    const updated = await Event.findByIdAndUpdate(ev._id, patch, { new: true });
    res.json(mapEvent(updated));
  } catch (err) {
    console.error("Update event error:", err);
    res.status(400).json({ message: "Invalid event id" });
  }
});

// User/Admin: delete (soft delete via status)
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const ev = await Event.findById(req.params.id);
    if (!ev) return res.status(404).json({ message: "Not found" });

    if (!isOwnerOrAdmin(req, ev)) {
      return res.status(403).json({ message: "Not allowed" });
    }

    if (req.user.role !== "admin") {
      // Rather than deleting, user requests deletion
      const updated = await Event.findByIdAndUpdate(ev._id, { status: "delete_requested" }, { new: true });
      return res.json(mapEvent(updated));
    } else {
      // Admin actually physical deletes from DB
      await Event.findByIdAndDelete(ev._id);
      return res.json(mapEvent(ev));
    }
  } catch (err) {
    console.error("Delete event error:", err);
    res.status(400).json({ message: "Invalid event id" });
  }
});

module.exports = router;