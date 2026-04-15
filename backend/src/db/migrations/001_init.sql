CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TABLE IF NOT EXISTS event_types (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  duration INTEGER NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  active BOOLEAN NOT NULL DEFAULT TRUE,
  buffer_before INTEGER NOT NULL DEFAULT 0,
  buffer_after INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS availability_settings (
  id BOOLEAN PRIMARY KEY DEFAULT TRUE,
  timezone TEXT NOT NULL DEFAULT 'UTC',
  is_on_break BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT availability_singleton CHECK (id = TRUE)
);

CREATE TABLE IF NOT EXISTS availability_weekly_rules (
  id BIGSERIAL PRIMARY KEY,
  day INTEGER NOT NULL CHECK (day BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  UNIQUE (day)
);

CREATE TABLE IF NOT EXISTS availability_date_overrides (
  id BIGSERIAL PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  start_time TIME NULL,
  end_time TIME NULL,
  blocked BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS bookings (
  id BIGSERIAL PRIMARY KEY,
  uid TEXT NOT NULL UNIQUE,
  event_type_id BIGINT NOT NULL REFERENCES event_types(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  date DATE NOT NULL,
  time TIME NOT NULL,
  duration INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'confirmed',
  starts_at TIMESTAMP GENERATED ALWAYS AS (date + time) STORED,
  ends_at TIMESTAMP GENERATED ALWAYS AS ((date + time) + (duration * INTERVAL '1 minute')) STORED,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'bookings_no_double_booking'
  ) THEN
    ALTER TABLE bookings
    ADD CONSTRAINT bookings_no_double_booking
    EXCLUDE USING gist (
      event_type_id WITH =,
      tsrange(starts_at, ends_at, '[)') WITH &&
    )
    WHERE (status = 'confirmed');
  END IF;
END $$;
