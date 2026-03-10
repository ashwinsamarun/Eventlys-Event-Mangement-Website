import api from "./client";

export async function fetchAllEvents() {
  const res = await api.get("/admin/events");
  return res.data;
}

export async function updateEventStatus(id, status, rejectReason = "") {
  const res = await api.patch(`/admin/events/${id}/status`, { status, rejectReason });
  return res.data;
}

export async function fetchAdminAnalytics() {
  const res = await api.get("/admin/analytics");
  return res.data;
}