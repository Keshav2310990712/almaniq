# Almaniq

Almaniq is a scheduling app for creating event types, setting weekly availability, sharing booking links, and managing bookings from one dashboard.

It is built with:
- `client/` - React + Vite
- `backend/` - Node.js + Express
- `PostgreSQL` - persistence for event types, availability, and bookings

## What We Built

- Event type management
  Create, edit, enable/disable, and delete booking event types.
- Availability management
  Set weekly day-wise hours, timezone, and date overrides.
- Public booking page
  Shareable booking links with calendar, slot selection, and booking form.
- Bookings dashboard
  View upcoming and past bookings, cancel them, and reschedule them.
- Break mode
  Instantly pause all booking slots with a global `Available / On Break` toggle.
- Availability heatmap
  Public booking page shows how free or busy each day is.
- Email notifications
  Booking confirmation, cancellation, and reschedule emails via Nodemailer.

## How The App Works

1. Create an event type
   Example: `15 Minute Intro` or `30 Minute Meeting`.
2. Configure availability
   Set which days are active, choose working hours for each day, set timezone, and add one-off date overrides.
3. Share the booking link
   Each event type gets a public route like `/book/:slug`.
4. User books a slot
   The booking page checks availability, existing bookings, break mode, and then shows valid slots.
5. Booking is saved
   The backend stores the booking in PostgreSQL and sends email notifications if configured.
6. Manage bookings
   From the dashboard, bookings can be viewed, cancelled, or rescheduled.
7. Pause booking anytime
   If break mode is turned on, slot responses become empty immediately without changing the saved availability schedule.

## Main Pages

- `/` - Event Types
- `/availability` - Availability settings
- `/bookings` - Booking management
- `/book/:slug` - Public booking page

## Live Deployment

- Frontend (Vercel): `https://almaniq.vercel.app/`
- Backend (Render): `https://almaniq.onrender.com`
- Health check: `https://almaniq.onrender.com/api/health`

Example public booking page:
- `https://almaniq.vercel.app/book/15min-intro`

## Run Locally

### 1. Prepare PostgreSQL

- Create a PostgreSQL database for the project.
- Copy env files first:

```bash
cp backend/.env.example backend/.env
cp client/.env.example client/.env
```

- Add your database connection in `backend/.env`.
- The backend runs `ensureSchema()` on startup, so missing columns added in development are applied automatically.

Important before pushing to GitHub:
- never commit real `.env` files
- rotate any secrets that were ever stored in a tracked file
- keep only `.env.example` in the repository

If you want sample data for quick testing, run the seed file:

```bash
psql -d your_database_name -f backend/src/db/seeds/seed.sql
```

The seed includes:
- default availability
- timezone
- break mode default set to off
- sample event types like `15min-intro`

### 2. Start the backend

Backend:

```bash
cd backend
npm install
npm run dev
```

### 3. Start the frontend

Frontend:

```bash
cd client
npm install
npm run dev
```

Then open the frontend URL shown by Vite, usually:

```bash
http://localhost:5173
```

### Environment Variables

Backend example values are in `backend/.env.example`.

Main backend variables:
- `PORT` - backend port
- `DATABASE_URL` - PostgreSQL connection string
- `DATABASE_SSL` - set to `true` for hosted databases that require SSL
- `CORS_ORIGIN` - allowed frontend origin(s), comma-separated if needed
- `APP_URL` - public frontend URL used in emails
- `SMTP_*` and `MAIL_FROM` - email configuration

Frontend example values are in `client/.env.example`.

Main frontend variable:
- `VITE_API_BASE_URL` - backend API base URL

## Local Testing Flow

Once both servers are running, you can test the app quickly like this:

1. Open the dashboard at `http://localhost:5173`.
2. Check seeded event types on the `Event Types` page.
3. Open `Availability` and confirm weekly hours/timezone are loaded.
4. Toggle an event on/off and confirm the state updates.
5. Open a public link such as `/book/15min-intro`.
6. Pick a date and confirm slots appear based on availability.
7. Create a booking and confirm it shows up in the `Bookings` page.
8. Cancel or reschedule that booking from the dashboard.
9. Test break mode from the sidebar and verify bookings are paused instantly.

## Break Mode Test

1. Start backend and frontend.
2. Open the dashboard sidebar.
3. Toggle `Available` to `On Break`.
4. Open a public booking page.
5. Confirm it shows `Currently not accepting bookings`.
6. Toggle back to `Available`.
7. Refresh the booking page and confirm slots return.


## Production

This project is deployed with:

- `Neon` for PostgreSQL
- `Render` for the backend API
- `Vercel` for the frontend

### Production URLs

- Frontend: `https://almaniq.vercel.app/`
- Backend API base: `https://almaniq.onrender.com/api`
- Backend health: `https://almaniq.onrender.com/api/health`

### Minimal Production Setup

1. Create a Neon PostgreSQL database and copy the connection string.
2. Deploy `backend/` to Render as a Node web service.
3. Add the backend environment variables in Render.
4. Let the backend start once so `ensureSchema()` can create/update tables automatically.
5. Run the existing seed script if you want starter availability and sample event types.
6. Deploy `client/` to Vercel.
7. Add the frontend environment variable in Vercel so the UI points to the Render API.

### Render Backend Configuration

Use `backend/` as the service root.

- Build command: `npm install`
- Start command: `npm start`

Recommended backend environment variables:

```env
NODE_ENV=production
PORT=10000
DATABASE_URL=your_neon_connection_string
DATABASE_SSL=true
CORS_ORIGIN=https://almaniq.vercel.app
APP_URL=https://almaniq.vercel.app
SMTP_HOST=your_smtp_host
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password
MAIL_FROM=Almaniq <no-reply@yourdomain.com>
```

Notes:
- `DATABASE_SSL=true` is the usual setting for Neon-hosted Postgres.
- `CORS_ORIGIN` supports comma-separated values if you want to allow preview or localhost origins too.
- Email is optional for deployment, but confirmations/cancellations/reschedules need valid SMTP settings.

### Vercel Frontend Configuration

Use `client/` as the project root.

- Build command: `npm run build`
- Output directory: `dist`

Required frontend environment variable:

```env
VITE_API_BASE_URL=https://almaniq.onrender.com/api
```

Routing note:
- `client/vercel.json` already rewrites all frontend routes to `index.html`, so routes like `/book/15min-intro` work correctly on refresh.

### Database Seed

The seed file already exists at `backend/src/db/seeds/seed.sql`.

Run it against Neon only if you want demo data:

```bash
psql "your_neon_connection_string" -f backend/src/db/seeds/seed.sql
```

The seed inserts:
- default availability settings
- timezone as `Asia/Kolkata`
- break mode set to off
- sample event types such as `15min-intro`, `30min-meeting`, and `project-review`

### Production API Checks

Quick endpoints you can use to verify the deployed backend:

- `GET https://almaniq.onrender.com/api/health`
- `GET https://almaniq.onrender.com/api/event-types`
- `GET https://almaniq.onrender.com/api/availability`
- `GET https://almaniq.onrender.com/api/bookings`
- `GET https://almaniq.onrender.com/api/slots?slug=15min-intro&date=2026-04-20&timezone=Asia/Kolkata`
- `GET https://almaniq.onrender.com/api/availability/heatmap?slug=15min-intro&month=2026-04&timezone=Asia/Kolkata`

Useful write endpoints:

- `POST https://almaniq.onrender.com/api/event-types`
- `PATCH https://almaniq.onrender.com/api/event-types/:id`
- `DELETE https://almaniq.onrender.com/api/event-types/:id`
- `POST https://almaniq.onrender.com/api/bookings`
- `PATCH https://almaniq.onrender.com/api/bookings/:uid/cancel`
- `POST https://almaniq.onrender.com/api/bookings/:uid/reschedule`
- `POST https://almaniq.onrender.com/api/availability`
- `PATCH https://almaniq.onrender.com/api/availability/break`

### Production Checklist

- frontend points to the Render API through `VITE_API_BASE_URL`
- backend `CORS_ORIGIN` includes the Vercel domain
- backend `DATABASE_URL` points to Neon
- backend `DATABASE_SSL=true` for hosted Postgres
- seed data has been applied only if sample records are desired
- SMTP values are added if email delivery is expected
- `https://almaniq.onrender.com/api/health` returns `{ "ok": true }`

## Notes

- PostgreSQL is required for the backend.
- SMTP config is needed in `backend/.env` if email sending is enabled.
- Seed data is available in `backend/src/db/seeds/seed.sql`.
