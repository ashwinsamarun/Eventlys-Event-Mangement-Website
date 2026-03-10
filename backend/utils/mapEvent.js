/**
 * Normalize a MongoDB Event document into the frontend-friendly shape.
 * Keeps your React UI compatible whether the backend stores `img` or `image`.
 */
module.exports = function mapEvent(ev) {
  if (!ev) return null;

  // Mongoose docs can be objects with getters; convert safely.
  const obj = typeof ev.toObject === "function" ? ev.toObject() : ev;

  const safeDateString = (d) => {
    if (!d) return null;
    try {
      const dObj = new Date(d);
      if (!isNaN(dObj.getTime())) return dObj.toISOString().split("T")[0];
    } catch(e) {}
    return String(d).split("T")[0];
  };

  return {
    id: String(obj._id || obj.id),
    title: obj.title,
    organizer: obj.organizer,
    description: obj.description || "",
    date: safeDateString(obj.date) || "TBD",
    time: obj.time || "TBD",
    startAt: safeDateString(obj.startAt) || safeDateString(obj.date),
    endAt: safeDateString(obj.endAt),
    timezone: obj.timezone || "Asia/Kolkata",
    category: obj.category || "Other",
    location: obj.location || "Venue TBA",
    price: obj.price ?? "Free",
    img: obj.img || obj.image || "",
    image: obj.image || obj.img || "",
    gallery: Array.isArray(obj.gallery) ? obj.gallery : [],
    venue: obj.venue || {},
    isOnline: Boolean(obj.isOnline),
    onlineUrl: obj.onlineUrl || "",
    tags: Array.isArray(obj.tags) ? obj.tags : [],
    ticketTypes: Array.isArray(obj.ticketTypes) ? obj.ticketTypes : [],
    capacity: Number(obj.capacity ?? 0),
    booked: Number(obj.booked ?? 0),
    status: obj.status || "pending",
    createdBy:
      obj.createdBy && typeof obj.createdBy === "object"
        ? {
            id: String(obj.createdBy._id || obj.createdBy.id || obj.createdBy),
            name: obj.createdBy.name || obj.createdBy.fullName || "",
            email: obj.createdBy.email || "",
            role: obj.createdBy.role || "",
          }
        : obj.createdBy
        ? { id: String(obj.createdBy) }
        : null,
    reviewedBy:
      obj.reviewedBy && typeof obj.reviewedBy === "object"
        ? {
            id: String(obj.reviewedBy._id || obj.reviewedBy.id || obj.reviewedBy),
            name: obj.reviewedBy.name || obj.reviewedBy.fullName || "",
            email: obj.reviewedBy.email || "",
            role: obj.reviewedBy.role || "",
          }
        : obj.reviewedBy
        ? { id: String(obj.reviewedBy) }
        : null,
    reviewedAt: obj.reviewedAt || null,
    rejectReason: obj.rejectReason || "",
    statusHistory: Array.isArray(obj.statusHistory) ? obj.statusHistory : [],
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt,
  };
};
