const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    bookingId: { type: String, required: true, unique: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },

    // 🔥 Store event snapshot (important)
    title: String,
    date: Date,
    location: String,
    category: String,
    image: String,
    price: String,

    qty: { type: Number, required: true },
    unitPrice: { type: Number, default: 0 },
    total: { type: Number, default: 0 },

    status: { type: String, enum: ["PAID", "CANCELLED"], default: "PAID" },
    cancelledAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Booking", bookingSchema);