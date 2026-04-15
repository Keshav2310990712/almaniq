function toMinutes(time) {
  const [h, m] = String(time || "").split(":").map(Number);
  if (!Number.isInteger(h) || !Number.isInteger(m)) return null;
  if (h < 0 || h > 23 || m < 0 || m > 59) return null;
  return h * 60 + m;
}

function toTime(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function overlaps(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && aEnd > bStart;
}

export function generateTimeSlots({
  date,
  availabilityRules = { days: [], startTime: "09:00", endTime: "17:00" },
  dateOverrides = [],
  existingBookings = [],
  eventDuration = 30,
  bufferBefore = 0,
  bufferAfter = 0
}) {
  if (!date || eventDuration <= 0) return [];

  const isoDate = String(date).slice(0, 10);
  const day = new Date(`${isoDate}T00:00:00`).getDay();
  if (Number.isNaN(day)) return [];

  const override = dateOverrides.find((o) => o.date === isoDate) || null;
  if (override?.blocked) return [];

  const isWorkingDay = availabilityRules.days.includes(day);
  if (!isWorkingDay && !override) return [];

  const start = toMinutes(override?.startTime ?? availabilityRules.startTime);
  const end = toMinutes(override?.endTime ?? availabilityRules.endTime);
  if (start == null || end == null || start >= end) return [];

  const bookings = existingBookings
    .filter((b) => String(b.date).slice(0, 10) === isoDate && b.status !== "cancelled")
    .map((b) => {
      const s = toMinutes(b.time);
      const e = s == null ? null : s + Number(b.duration || eventDuration);
      if (s == null || e == null) return null;
      return {
        start: s - Math.max(0, bufferBefore),
        end: e + Math.max(0, bufferAfter)
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.start - b.start);

  const slots = [];
  for (let t = start; t + eventDuration <= end; t += eventDuration) {
    const slotStart = t;
    const slotEnd = t + eventDuration;
    const blocked = bookings.some((b) => overlaps(slotStart, slotEnd, b.start, b.end));
    if (!blocked) slots.push(toTime(slotStart));
  }

  return slots;
}
