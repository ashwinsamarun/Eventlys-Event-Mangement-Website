require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const mongoose = require("mongoose");

const app = express();

// ✅ Safe defaults so nothing becomes "undefined"
const PORT = process.env.PORT || 5000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:3000";
const MONGO_URI = process.env.MONGO_URI;

// ✅ Middleware (same behavior as before)
app.use(cors({ origin: CLIENT_ORIGIN, credentials: true }));
app.use(express.json());
app.use(morgan("dev"));

// ✅ Health
app.get("/api/health", (req, res) => {
  res.json({ ok: true, service: "eventlys-api" });
});

// ✅ Register models (consistent order)
require("./models/User");
require("./models/Event");
require("./models/Booking");
require("./models/Notification"); // ✅ added here (was later)

// ✅ Routes (same as your existing code)
const authRoutes = require("./routes/auth");
app.use("/api/auth", authRoutes);
app.use("/api/auth", require("./routes/auth_reset")); // keep after authRoutes

const eventRoutes = require("./routes/event");
app.use("/api/events", eventRoutes);

const bookingRoutes = require("./routes/booking");
app.use("/api/bookings", bookingRoutes);

const userRoutes = require("./routes/user");
app.use("/api/users", userRoutes);

// ✅ Admin routes
const adminRoutes = require("./routes/admin");
app.use("/api/admin", adminRoutes);

// ✅ Notifications routes
app.use("/api/notifications", require("./routes/notification"));

async function start() {
  // ✅ Fail fast with a clear error instead of silent undefined behavior
  if (!MONGO_URI) {
    throw new Error("Missing MONGO_URI in backend/.env");
  }

  await mongoose.connect(MONGO_URI);
  console.log("✅ MongoDB connected");

  // ✅ Upcoming reminders scheduler (non-breaking)
  // Runs after DB connect so it never crashes on boot
  try {
    const { runUpcomingNotifications } = require("./utils/upcomingNotifications");

    // run once on boot, then every 30 mins
    runUpcomingNotifications().catch(console.error);
    setInterval(() => runUpcomingNotifications().catch(console.error), 30 * 60 * 1000);

    console.log("✅ Upcoming notifications scheduler started");
  } catch (e) {
    // If you haven't created the file yet, server still runs fine
    console.log("ℹ️ Upcoming notifications scheduler not enabled (missing utils/upcomingNotifications.js)");
  }

  app.listen(PORT, () => {
    console.log(`✅ API running on http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error("❌ Failed to start server:", err);
  process.exit(1);
});