import * as bookingRepository from "../repositories/booking.repository.js";
import * as availabilityRepository from "../repositories/availability.repository.js";
import * as eventTypeRepository from "../repositories/eventType.repository.js";
import { AppError } from "../lib/errors.js";
import { getWeekdayInTimeZone } from "../lib/date.js";
import { generateTimeSlots } from "../lib/slotEngine.js";

export async function listSlots(filters) {
  const { eventId, date } = filters || {};

  if (!eventId) {
    throw new AppError("eventId is required", 400);
  }

  if (!date) {
    throw new AppError("date is required", 400);
  }

  const [eventTypes, availability, bookings] = await Promise.all([
    eventTypeRepository.listEventTypes(filters),
    availabilityRepository.getAvailability(filters),
    bookingRepository.listBookings(filters)
  ]);

  const eventType = Array.isArray(eventTypes)
    ? eventTypes.find((item) => String(item?.id) === String(eventId))
    : null;

  if (!eventType) {
    throw new AppError("Event type not found", 404);
  }

  const timezone = availability?.timezone || "UTC";

  if (availability?.isOnBreak) {
    return {
      timezone,
      isOnBreak: true,
      slots: []
    };
  }

  const dayInTimeZone = getWeekdayInTimeZone(date, timezone);
  const resolvedWeeklyRule = Array.isArray(availability?.weeklyRules)
    ? availability.weeklyRules.find((item) => item.day === dayInTimeZone)
    : null;

  const dateOverrides = Array.isArray(availability?.dateOverrides)
    ? availability.dateOverrides
    : Array.isArray(availability?.blockedDates)
      ? availability.blockedDates.map((blockedDate) => ({
          date: blockedDate,
          blocked: true
        }))
      : [];

  const slots = generateTimeSlots({
    date,
    availabilityRules: {
      days: resolvedWeeklyRule ? [resolvedWeeklyRule.day] : Array.isArray(availability?.days) ? availability.days : [],
      startTime: resolvedWeeklyRule?.startTime || availability?.startTime || "09:00",
      endTime: resolvedWeeklyRule?.endTime || availability?.endTime || "17:00"
    },
    dateOverrides,
    existingBookings: Array.isArray(bookings) ? bookings : [],
    eventDuration: Number(eventType.duration || 30),
    bufferBefore: Number(eventType.bufferBefore || 0),
    bufferAfter: Number(eventType.bufferAfter || 0)
  });

  return {
    timezone,
    isOnBreak: false,
    slots
  };
}
