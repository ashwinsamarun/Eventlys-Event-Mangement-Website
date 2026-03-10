const mongoose = require("mongoose");

const TicketTypeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    price: { type: Number, default: 0, min: 0 },
    currency: { type: String, default: "INR", trim: true },
    quantity: { type: Number, default: 0, min: 0 },
    sold: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

const VenueSchema = new mongoose.Schema(
  {
    name: { type: String, default: "", trim: true },
    addressLine1: { type: String, default: "", trim: true },
    addressLine2: { type: String, default: "", trim: true },
    city: { type: String, default: "", trim: true },
    state: { type: String, default: "", trim: true },
    country: { type: String, default: "", trim: true },
    postalCode: { type: String, default: "", trim: true },
    mapUrl: { type: String, default: "", trim: true },
  },
  { _id: false }
);

const EventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    organizer: { type: String, required: true, trim: true },
    description: { type: String, default: "" },

    // When the event happens
    date: { type: Date, required: true },
    time: { type: String, default: "TBD" },

    // Canonical timestamps
    startAt: { type: Date },
    endAt: { type: Date },
    timezone: { type: String, default: "Asia/Kolkata", trim: true },

    category: { type: String, default: "Other" },
    location: { type: String, default: "Venue TBA" },
    price: { type: String, default: "Free" },

    // Structured location & online info
    venue: { type: VenueSchema, default: () => ({}) },
    isOnline: { type: Boolean, default: false },
    onlineUrl: { type: String, default: "", trim: true },

    tags: { type: [String], default: [] },

    ticketTypes: { type: [TicketTypeSchema], default: [] },

    // Keep both for backward compatibility with the React UI
    img: { type: String, default: "" },
    image: { type: String, default: "" },

    gallery: { type: [String], default: [] },

    capacity: { type: Number, default: 200, min: 0 },
    booked: { type: Number, default: 0, min: 0 },

    status: {
      type: String,
      enum: ["approved", "rejected", "deleted", "pending", "delete_requested"],
      default: "pending",
      index: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // --- Admin review metadata (for moderation workflow)
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    reviewedAt: { type: Date, default: null, index: true },
    rejectReason: { type: String, default: "", trim: true },
    statusHistory: {
      type: [
        {
          status: { type: String, enum: ["approved", "rejected", "deleted", "pending", "delete_requested"], required: true },
          by: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
          at: { type: Date, default: Date.now },
          note: { type: String, default: "", trim: true },
        },
      ],
      default: [],
    },
  },
  { timestamps: true }
);

// Helpful indexes
EventSchema.index({ status: 1, date: 1 });
EventSchema.index({ status: 1, startAt: 1 });
EventSchema.index({ title: "text", organizer: "text", description: "text", category: "text", location: "text" });
EventSchema.index({ createdBy: 1, createdAt: -1 });

// Keep startAt aligned for legacy clients that only send date/time
EventSchema.pre("save", function syncStartAt() {
  if (!this.startAt && this.date) {
    this.startAt = this.date;
  }
});

module.exports = mongoose.model("Event", EventSchema);
