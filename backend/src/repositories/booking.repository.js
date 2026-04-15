import { pool } from "../db/pool.js";

function getExecutor(client) {
  return client || pool;
}

export async function listBookings(filters = {}, client) {
  const db = getExecutor(client);
  const values = [];
  const where = [];

  if (filters.eventTypeId) {
    values.push(String(filters.eventTypeId));
    where.push(`event_type_id = $${values.length}`);
  }

  if (filters.date) {
    values.push(String(filters.date).slice(0, 10));
    where.push(`date = $${values.length}`);
  }

  if (filters.status) {
    values.push(String(filters.status));
    where.push(`status = $${values.length}`);
  }

  const whereClause = where.length ? `where ${where.join(" and ")}` : "";
  const result = await db.query(
    `
      select
        uid,
        event_type_id as "eventTypeId",
        name,
        email,
        answers,
        date::text as date,
        to_char(time, 'HH24:MI') as time,
        duration,
        status,
        created_at as "createdAt"
      from bookings
      ${whereClause}
      order by date asc, time asc
    `,
    values
  );

  return result.rows;
}

export async function createBooking(payload, client) {
  const db = getExecutor(client);
  const result = await db.query(
    `
      insert into bookings (
        uid,
        event_type_id,
        name,
        email,
        answers,
        date,
        time,
        duration,
        status
      )
      values ($1, $2, $3, $4, $5, $6, $7, $8, 'confirmed')
      returning
        uid,
        event_type_id as "eventTypeId",
        name,
        email,
        answers,
        date::text as date,
        to_char(time, 'HH24:MI') as time,
        duration,
        status,
        created_at as "createdAt"
    `,
    [
      payload.uid,
      payload.eventTypeId,
      payload.name,
      payload.email,
      JSON.stringify(payload.answers ?? {}),
      payload.date,
      payload.time,
      payload.duration
    ]
  );

  return result.rows[0];
}

export async function cancelBooking(uid, client) {
  const db = getExecutor(client);
  const result = await db.query(
    `
      update bookings
      set status = 'cancelled'
      where uid = $1
      returning
        uid,
        event_type_id as "eventTypeId",
        name,
        email,
        answers,
        date::text as date,
        to_char(time, 'HH24:MI') as time,
        duration,
        status,
        created_at as "createdAt"
    `,
    [uid]
  );

  return result.rows[0] || null;
}

export async function getBookingByUid(uid, client) {
  const db = getExecutor(client);
  const result = await db.query(
    `
      select
        uid,
        event_type_id as "eventTypeId",
        name,
        email,
        answers,
        date::text as date,
        to_char(time, 'HH24:MI') as time,
        duration,
        status,
        created_at as "createdAt"
      from bookings
      where uid = $1
      limit 1
    `,
    [uid]
  );

  return result.rows[0] || null;
}

export async function rescheduleBooking(uid, updates, client) {
  const db = getExecutor(client);
  const result = await db.query(
    `
      update bookings
      set
        date = $2,
        time = $3,
        duration = $4,
        status = 'confirmed'
      where uid = $1
      returning
        uid,
        event_type_id as "eventTypeId",
        name,
        email,
        answers,
        date::text as date,
        to_char(time, 'HH24:MI') as time,
        duration,
        status,
        created_at as "createdAt"
    `,
    [uid, updates.date, updates.time, updates.duration]
  );

  return result.rows[0] || null;
}

export async function hasBookingsForEventType(eventTypeId, client) {
  const db = getExecutor(client);
  const result = await db.query(
    `
      select 1
      from bookings
      where event_type_id = $1
        and status <> 'cancelled'
      limit 1
    `,
    [String(eventTypeId)]
  );

  return result.rowCount > 0;
}
