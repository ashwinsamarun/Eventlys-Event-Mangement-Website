const KEY = "eventlys_bookings_v1";

export const getBookings = () => {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || [];
  } catch {
    return [];
  }
};

export const addBooking = (booking) => {
  const prev = getBookings();
  const next = [booking, ...prev].slice(0, 50);
  localStorage.setItem(KEY, JSON.stringify(next));
  return next;
};

export const removeBooking = (bookingId) => {
  const prev = getBookings();
  const next = prev.filter((b) => b.bookingId !== bookingId);
  localStorage.setItem(KEY, JSON.stringify(next));
  return next;
};
