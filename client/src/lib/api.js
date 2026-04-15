import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"
});

export async function getEventTypes() {
  const response = await api.get("/event-types");
  return response.data.data;
}

export async function getEventTypeBySlug(slug) {
  const response = await api.get("/event-types", {
    params: { slug }
  });
  return response.data.data;
}

export async function createEventType(payload) {
  const response = await api.post("/event-types", payload);
  return response.data.data;
}

export async function updateEventType(id, payload) {
  const response = await api.patch(`/event-types/${id}`, payload);
  return response.data.data;
}

export async function deleteEventType(id) {
  const response = await api.delete(`/event-types/${id}`);
  return response.data.data;
}

export async function getSlots(filters) {
  const response = await api.get("/slots", {
    params: filters
  });
  return response.data.data;
}

export async function createBooking(payload) {
  const response = await api.post("/bookings", payload);
  return response.data.data;
}

export async function getBookings() {
  const response = await api.get("/bookings");
  return response.data.data;
}

export async function cancelBooking(uid) {
  const response = await api.patch(`/bookings/${uid}/cancel`);
  return response.data.data;
}

export async function rescheduleBooking(uid, payload) {
  const response = await api.post(`/bookings/${uid}/reschedule`, payload);
  return response.data.data;
}

export async function getHeatmap(filters) {
  const response = await api.get("/availability/heatmap", {
    params: filters
  });
  return response.data.data;
}

export async function getAvailability() {
  const response = await api.get("/availability");
  return response.data.data;
}

export async function saveAvailability(payload, options) {
  const response = await api.post("/availability", payload, {
    signal: options?.signal
  });
  return response.data.data;
}

export async function updateBreakMode(is_on_break) {
  const response = await api.patch("/availability/break", {
    is_on_break
  });
  return response.data.data;
}
