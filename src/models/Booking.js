const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    bookingId: { type: String, required: true, unique: true },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
      index: true,
    },

    // 🔥 Event snapshot (VERY IMPORTANT)
    title: { type: String },
    date: { type: Date },
    location: { type: String },
    category: { type: String },
    image: { type: String },
    price: { type: String },

    qty: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, default: 0 },
    total: { type: Number, default: 0 },

    status: {
      type: String,
      enum: ["PAID", "CANCELLED"],
      default: "PAID",
      index: true,
    },

    cancelledAt: { type: Date },
  },
  { timestamps: true }
);

bookingSchema.index({ userId: 1, createdAt: -1 });
bookingSchema.index({ eventId: 1, createdAt: -1 });

module.exports = mongoose.model("Booking", bookingSchema);