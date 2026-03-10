// src/api/event.js
import client from "./client";

// Public approved events
export async function fetchApprovedEvents(params = {}) {
  const res = await client.get("/events", { params });
  return res.data?.items ?? res.data; // supports meta=1 or array response
}

// Single event (public approved OR creator/admin can see pending/rejected if token set)
export async function fetchEventById(id) {
  const res = await client.get(`/events/${id}`);
  return res.data?.event ?? res.data;
}

// Creator events (my submissions)
export async function fetchMyEvents() {
  const res = await client.get("/events/me");
  return res.data?.items ?? res.data;
}

// Submit new event (pending)
export async function createEvent(payload) {
  const res = await client.post("/events", payload);
  return res.data?.event ?? res.data;
}

// Soft delete (or status change)
export async function deleteEvent(id) {
  const res = await client.delete(`/events/${id}`);
  return res.data;
}

// Update (optional helper)
export async function updateEvent(id, patch) {
  const res = await client.patch(`/events/${id}`, patch);
  return res.data?.event ?? res.data;
}

// My event analytics
export async function fetchMyAnalytics() {
  const res = await client.get("/events/my-analytics");
  return res.data;
}