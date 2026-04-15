import { Router } from "express";
import * as bookingController from "../controllers/bookings.controller.js";

const router = Router();

router.get("/slots", bookingController.listAvailableSlots);
router.post("/", bookingController.createBooking);
router.get("/", bookingController.listBookings);
router.patch("/:uid/cancel", bookingController.cancelBooking);
router.post("/:uid/reschedule", bookingController.rescheduleBooking);

export default router;
