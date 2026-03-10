const Booking = require("../models/Booking");
const Notification = require("../models/Notification");

async function runUpcomingNotifications() {
  const now = new Date();
  const soon = new Date(now.getTime() + 24 * 60 * 60 * 1000); // next 24 hours

  // Upcoming paid bookings
  const upcoming = await Booking.find({
    status: "PAID",
    date: { $gte: now, $lte: soon },
  }).select("_id bookingId userId eventId title date");

  // Create notifications (dedupe by uniqueKey)
  for (const b of upcoming) {
    const uniqueKey = `UPCOMING:${b._id.toString()}`;

    try {
      await Notification.create({
        userId: b.userId,
        type: "UPCOMING_EVENT",
        title: "Upcoming Event Reminder",
        message: `Reminder: "${b.title}" is happening within 24 hours.`,
        uniqueKey,
        meta: {
          bookingId: b._id,
          bookingCode: b.bookingId,
          eventId: b.eventId,
          eventTitle: b.title,
          eventDate: b.date,
        },
      });
    } catch (e) {
      // Ignore duplicate key errors
      if (e?.code !== 11000) console.error("Upcoming notif create error:", e);
    }
  }
}

module.exports = { runUpcomingNotifications };