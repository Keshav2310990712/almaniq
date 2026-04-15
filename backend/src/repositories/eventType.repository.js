import { pool } from "../db/pool.js";

const EVENT_TYPE_FIELDS = `
  id::text as id,
  title,
  slug,
  duration,
  description,
  booking_questions as "bookingQuestions",
  active,
  buffer_before as "bufferBefore",
  buffer_after as "bufferAfter",
  created_at as "createdAt"
`;

export async function listEventTypes(filters = {}) {
  const values = [];
  const where = [];
  const eventTypeId = filters.id ?? filters.eventTypeId;

  if (eventTypeId) {
    values.push(String(eventTypeId));
    where.push(`id = $${values.length}`);
  }

  if (filters.slug) {
    values.push(String(filters.slug));
    where.push(`slug = $${values.length}`);
  }

  const whereClause = where.length ? `where ${where.join(" and ")}` : "";
  const result = await pool.query(
    `
      select ${EVENT_TYPE_FIELDS}
      from event_types
      ${whereClause}
      order by created_at desc
    `,
    values
  );

  return result.rows;
}

export async function getEventTypeBySlug(slug) {
  const result = await pool.query(
    `
      select ${EVENT_TYPE_FIELDS}
      from event_types
      where slug = $1
      limit 1
    `,
    [String(slug)]
  );

  return result.rows[0] || null;
}

export async function createEventType(payload) {
  const result = await pool.query(
    `
      insert into event_types (
        title,
        slug,
        duration,
        description,
        booking_questions,
        active,
        buffer_before,
        buffer_after
      )
      values ($1, $2, $3, $4, $5, $6, $7, $8)
      returning ${EVENT_TYPE_FIELDS}
    `,
    [
      payload.title,
      payload.slug,
      payload.duration,
      payload.description ?? "",
      serializeBookingQuestions(payload.bookingQuestions, []),
      payload.active ?? true,
      payload.bufferBefore ?? 0,
      payload.bufferAfter ?? 0
    ]
  );

  return result.rows[0];
}

export async function updateEventType(id, payload) {
  const result = await pool.query(
    `
      update event_types
      set
        title = coalesce($2, title),
        slug = coalesce($3, slug),
        duration = coalesce($4, duration),
        description = coalesce($5, description),
        booking_questions = coalesce($6, booking_questions),
        active = coalesce($7, active),
        buffer_before = coalesce($8, buffer_before),
        buffer_after = coalesce($9, buffer_after)
      where id = $1
      returning ${EVENT_TYPE_FIELDS}
    `,
    [
      String(id),
      payload.title,
      payload.slug,
      payload.duration,
      payload.description,
      serializeBookingQuestions(payload.bookingQuestions, null),
      payload.active,
      payload.bufferBefore,
      payload.bufferAfter
    ]
  );

  return result.rows[0] || null;
}

export async function deleteEventType(id) {
  const result = await pool.query(
    `
      delete from event_types
      where id = $1
      returning id::text as id
    `,
    [String(id)]
  );

  return result.rows[0] ? { id: result.rows[0].id, deleted: true } : null;
}

function serializeBookingQuestions(value, fallback) {
  if (value == null) {
    return fallback;
  }

  return JSON.stringify(value);
}
