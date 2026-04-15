import * as availabilityRepository from "../repositories/availability.repository.js";
import * as eventTypeRepository from "../repositories/eventType.repository.js";
import { AppError } from "../lib/errors.js";
import { isValidTimeZone, toIsoDate } from "../lib/date.js";

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

export async function getAvailability(filters) {
  return availabilityRepository.getAvailability(filters);
}

export async function updateBreakMode(payload) {
  if (typeof payload?.is_on_break !== "boolean") {
    throw new AppError("is_on_break must be a boolean", 400);
  }

  const result = await availabilityRepository.updateBreakMode(payload.is_on_break);

  return {
    isOnBreak: result.isOnBreak
  };
}

export async function createAvailability(payload) {
  const timezone = String(payload?.timezone || "UTC");
  const weeklyRules = Array.isArray(payload?.weeklyRules) ? payload.weeklyRules : [];
  const dateOverrides = Array.isArray(payload?.dateOverrides) ? payload.dateOverrides : [];

  if (!isValidTimeZone(timezone)) {
    throw new AppError("timezone must be a valid IANA timezone", 400);
  }

  for (const rule of weeklyRules) {
    if (!Number.isInteger(rule?.day) || rule.day < 0 || rule.day > 6) {
      throw new AppError("Each weekly rule must include a valid day", 400);
    }
    if (!rule?.startTime || !rule?.endTime) {
      throw new AppError("Each weekly rule must include startTime and endTime", 400);
    }
    assertValidTimeRange(rule.startTime, rule.endTime, "Each weekly rule must have a valid time range");
  }

  const normalizedOverrides = dateOverrides.map((override) => {
    const date = toIsoDate(override?.date);
    if (!date) {
      throw new AppError("Each date override must include a valid date", 400);
    }

    const startTime = override?.startTime || null;
    const endTime = override?.endTime || null;
    const blocked = Boolean(override?.blocked);

    if (!blocked && (!startTime || !endTime)) {
      throw new AppError("Each available date override must include startTime and endTime", 400);
    }

    if ((startTime && !endTime) || (!startTime && endTime)) {
      throw new AppError("Each date override must include both startTime and endTime", 400);
    }

    if (startTime && endTime) {
      assertValidTimeRange(startTime, endTime, "Each date override must have a valid time range");
    }

    return {
      date,
      startTime,
      endTime,
      blocked
    };
  });

  return availabilityRepository.createAvailability({
    timezone,
    weeklyRules: weeklyRules.map((rule) => ({
      day: rule.day,
      startTime: rule.startTime,
      endTime: rule.endTime
    })),
    dateOverrides: normalizedOverrides
  });
}

export async function getAvailabilityHeatmap(filters) {
  const eventId = filters?.eventId;
  const month = String(filters?.month || "");

  if (!eventId) {
    throw new AppError("eventId is required", 400);
  }

  if (!/^\d{4}-\d{2}$/.test(month)) {
    throw new AppError("month must be in YYYY-MM format", 400);
  }

  const eventTypes = await eventTypeRepository.listEventTypes({ id: eventId });
  if (!eventTypes.length) {
    throw new AppError("Event type not found", 404);
  }

  const [availability, days] = await Promise.all([
    availabilityRepository.getAvailability(),
    availabilityRepository.getAvailabilityHeatmap({ eventId, month })
  ]);

  return {
    eventId: String(eventId),
    month,
    timezone: availability.timezone || "UTC",
    days
  };
}

function assertValidTimeRange(startTime, endTime, message) {
  if (!TIME_PATTERN.test(String(startTime)) || !TIME_PATTERN.test(String(endTime))) {
    throw new AppError(message, 400);
  }

  if (String(startTime) >= String(endTime)) {
    throw new AppError(message, 400);
  }
}
