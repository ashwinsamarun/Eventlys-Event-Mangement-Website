import api from "./client";

// Checkout uses this
export async function createBooking(payload) {
  const res = await api.post("/bookings", payload);
  return res.data;
}

// Dashboard uses this
export async function fetchMyBookings() {
  const res = await api.get("/bookings/me");
  return res.data;
}

// Dashboard uses this
export async function cancelBooking(id) {
  const res = await api.post(`/bookings/${id}/cancel`);
  return res.data;
}