import { Router } from "express";
import eventTypeRoutes from "./eventTypes.routes.js";
import availabilityRoutes from "./availability.routes.js";
import bookingRoutes from "./bookings.routes.js";
import slotsRoutes from "./slots.routes.js";

const router = Router();

router.get("/health", (_req, res) => res.json({ ok: true }));
router.use("/slots", slotsRoutes);
router.use("/event-types", eventTypeRoutes);
router.use("/availability", availabilityRoutes);
router.use("/bookings", bookingRoutes);

export default router;
