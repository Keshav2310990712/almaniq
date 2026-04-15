import * as eventTypeRepository from "../repositories/eventType.repository.js";
import * as bookingRepository from "../repositories/booking.repository.js";
import { AppError } from "../lib/errors.js";

export async function listEventTypes(filters) {
  if (filters?.slug) {
    return eventTypeRepository.getEventTypeBySlug(filters.slug);
  }

  return eventTypeRepository.listEventTypes(filters);
}

export async function createEventType(payload) {
  try {
    return await eventTypeRepository.createEventType({
      title: payload?.title,
      slug: payload?.slug,
      duration: Number(payload?.duration || 30),
      description: payload?.description || "",
      bookingQuestions: normalizeBookingQuestions(payload?.bookingQuestions),
      active: payload?.active ?? true,
      bufferBefore: Number(payload?.bufferBefore || 0),
      bufferAfter: Number(payload?.bufferAfter || 0)
    });
  } catch (error) {
    throw mapSlugConflict(error);
  }
}

export async function updateEventType(id, payload) {
  try {
    const eventType = await eventTypeRepository.updateEventType(id, {
      title: payload?.title,
      slug: payload?.slug,
      duration: payload?.duration == null ? null : Number(payload.duration),
      description: payload?.description,
      bookingQuestions: payload?.bookingQuestions == null
        ? null
        : normalizeBookingQuestions(payload.bookingQuestions),
      active: payload?.active,
      bufferBefore: payload?.bufferBefore == null ? null : Number(payload.bufferBefore),
      bufferAfter: payload?.bufferAfter == null ? null : Number(payload.bufferAfter)
    });

    if (!eventType) {
      throw new AppError("Event type not found", 404);
    }

    return eventType;
  } catch (error) {
    throw mapSlugConflict(error);
  }
}

export async function deleteEventType(id) {
  const hasBookings = await bookingRepository.hasBookingsForEventType(id);

  if (hasBookings) {
    throw new AppError(
      "This event type already has bookings. Disable it instead of deleting.",
      409
    );
  }

  const result = await eventTypeRepository.deleteEventType(id);

  if (!result) {
    throw new AppError("Event type not found", 404);
  }

  return result;
}

function mapSlugConflict(error) {
  if (error instanceof AppError) {
    return error;
  }

  if (error?.code === "23505") {
    return new AppError("Slug must be unique", 409);
  }

  return error;
}

function normalizeBookingQuestions(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => String(item || "").trim())
    .filter(Boolean)
    .slice(0, 5);
}
