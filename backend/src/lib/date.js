export function toIsoDate(value) {
  if (!value) return null;
  const d = new Date(value);
  return isNaN(d) ? null : d.toISOString().slice(0, 10);
}

const WEEKDAY_INDEX = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function isValidTimeZone(timeZone) {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone });
    return true;
  } catch {
    return false;
  }
}

export function getWeekdayInTimeZone(date, timeZone = "UTC") {
  if (!date) return null;

  const d = new Date(`${date}T12:00:00Z`);
  if (isNaN(d)) return null;

  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
  }).format(d);

  return WEEKDAY_INDEX.indexOf(weekday);
}