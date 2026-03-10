// src/utils/seats.js
const KEY = "eventlys_seats_v1";

/**
 * Stores a map of eventId -> bookedCount in localStorage
 * This works for DEFAULT_EVENTS and user-created events too.
 */
export const getSeatMap = () => {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || {};
  } catch {
    return {};
  }
};

export const getBooked = (eventId) => {
  const map = getSeatMap();
  return Number(map[String(eventId)] || 0);
};

export const setBooked = (eventId, booked) => {
  const map = getSeatMap();
  map[String(eventId)] = Math.max(0, Number(booked || 0));
  localStorage.setItem(KEY, JSON.stringify(map));
  return map;
};

export const addBooked = (eventId, qty) => {
  const current = getBooked(eventId);
  return setBooked(eventId, current + Math.max(0, Number(qty || 0)));
};

export const getCapacity = (event, fallback = 200) => {
  const cap = Number(event?.capacity);
  return Number.isFinite(cap) && cap > 0 ? cap : fallback;
};

export const getRemaining = (event) => {
  const capacity = getCapacity(event);
  const booked = Math.max(Number(event?.booked || 0), getBooked(event?.id));
  return Math.max(0, capacity - booked);
};

export const isSoldOut = (event) => getRemaining(event) <= 0;
