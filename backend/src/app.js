import cors from "cors";
import express from "express";
import morgan from "morgan";
import availabilityRoutes from "./routes/availability.routes.js";
import bookingRoutes from "./routes/bookings.routes.js";
import eventTypeRoutes from "./routes/eventTypes.routes.js";
import slotsRoutes from "./routes/slots.routes.js";
import { notFoundHandler, errorHandler } from "./middleware/error.middleware.js";

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(",").map((origin) => origin.trim()) : true
  })
);
app.use(morgan("dev"));
app.use(express.json());
app.get("/api/health", (_req, res) => res.json({ ok: true }));
app.use("/api/event-types", eventTypeRoutes);
app.use("/api/slots", slotsRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/availability", availabilityRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
