-- Development seed data
-- Safe to re-run after clearing tables, but not intended for production.

-- clleanup if you want a reset state before locally seeding , comment out if you dont want to truncate everytime before seeding
TRUNCATE TABLE bookings, availability_weekly_rules, availability_date_overrides, event_types RESTART IDENTITY CASCADE;
DELETE FROM availability_settings;

-- Default timezone/settings
INSERT INTO availability_settings (id, timezone, is_on_break)
VALUES (TRUE, 'Asia/Kolkata', FALSE) -- indian timezone , can change
ON CONFLICT (id) DO UPDATE
SET timezone = EXCLUDED.timezone,
    is_on_break = EXCLUDED.is_on_break,
    updated_at = NOW();

-- Default weekly availability kept Monday-Friday, 9 AM to 5 PM due to task instructions
INSERT INTO availability_weekly_rules (day, start_time, end_time)
VALUES
  (1, '09:00', '17:00'),
  (2, '09:00', '17:00'),
  (3, '09:00', '17:00'),
  (4, '09:00', '17:00'),
  (5, '09:00', '17:00')
ON CONFLICT (day) DO UPDATE
SET start_time = EXCLUDED.start_time,
    end_time = EXCLUDED.end_time;

-- Sample event types
INSERT INTO event_types (
  title,
  slug,
  duration,
  description,
  booking_questions,
  active,
  buffer_before,
  buffer_after
)
VALUES
  (
    '15 Minute Intro',
    '15min-intro',
    15,
    'Quick introduction call',
    '["What would you like to discuss?"]'::jsonb,
    TRUE,
    0,
    0
  ),
  (
    '30 Minute Meeting',
    '30min-meeting',
    30,
    'General discussion and planning',
    '["Company or college name", "What is the goal of this meeting?"]'::jsonb,
    TRUE,
    0,
    0
  ),
  (
    'Project Review',
    'project-review',
    45,
    'Detailed project review session',
    '[]'::jsonb,
    TRUE,
    10,
    10
  )
ON CONFLICT (slug) DO UPDATE
SET title = EXCLUDED.title,
    duration = EXCLUDED.duration,
    description = EXCLUDED.description,
    booking_questions = EXCLUDED.booking_questions,
    active = EXCLUDED.active,
    buffer_before = EXCLUDED.buffer_before,
    buffer_after = EXCLUDED.buffer_after;
