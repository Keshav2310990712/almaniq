import { pool } from "./pool.js";

export async function ensureSchema() {
  await pool.query(`
    ALTER TABLE availability_settings
    ADD COLUMN IF NOT EXISTS is_on_break BOOLEAN NOT NULL DEFAULT FALSE;
  `);

  await pool.query(`
    ALTER TABLE event_types
    ADD COLUMN IF NOT EXISTS booking_questions JSONB NOT NULL DEFAULT '[]'::jsonb;
  `);

  await pool.query(`
    ALTER TABLE bookings
    ADD COLUMN IF NOT EXISTS answers JSONB NOT NULL DEFAULT '{}'::jsonb;
  `);
}
