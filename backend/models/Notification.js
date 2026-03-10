const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    type: {
      type: String,
      enum: ["BOOKING_CONFIRMED", "BOOKING_CANCELLED", "UPCOMING_EVENT", "HOST_SUCCESS", "NEW_EVENT"],
      required: true,
    },

    title: { type: String, required: true },
    message: { type: String, required: true },

    // metadata for navigation/useful context
    meta: {
      bookingId: { type: mongoose.Schema.Types.ObjectId },
      bookingCode: { type: String }, // e.g. EVT-XXXXX
      eventId: { type: mongoose.Schema.Types.ObjectId },
      eventTitle: { type: String },
      eventDate: { type: Date },
    },

    read: { type: Boolean, default: false },

    // Used to prevent duplicates (esp. upcoming alerts). Generated default prevents E11000 null collisions.
    uniqueKey: { type: String, default: () => new mongoose.Types.ObjectId().toString(), index: true },
  },
  { timestamps: true }
);

// Prevent duplicate upcoming notifications
notificationSchema.index({ userId: 1, uniqueKey: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model("Notification", notificationSchema);