const mongoose = require("mongoose");

const EventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },

    description: { type: String, default: "" },
    location: { type: String, default: "" },
    image: { type: String, default: "" },

    date: { type: Date, required: true },
    time: { type: String, default: "TBD" },

    // ✅ add this so the pre-save hook is valid
    startAt: { type: Date },

    category: { type: String, default: "Other" },
    price: { type: String, default: "Free" },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "deleted"],
      default: "pending",
      index: true,
    },

    // NOTE: if you want organizer to be a string name, keep it String.
    // If organizer is the user reference, keep it ObjectId.
    organizer: { type: String, required: true, trim: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

    capacity: { type: Number, default: 200, min: 0 },
    booked: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

// ✅ Keep startAt aligned for legacy clients that only send date/time
EventSchema.pre("save", function syncStartAt() {
  if (!this.startAt && this.date) {
    this.startAt = this.date;
  }
});

// Performance indexes
EventSchema.index({ status: 1, date: 1 });
EventSchema.index({ createdBy: 1, createdAt: -1 });

module.exports = mongoose.model("Event", EventSchema);