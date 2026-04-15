import * as bookingService from "../services/bookings.service.js";
import { ok } from "../lib/response.js";

export async function listBookings(req, res, next) {
  try {
    const data = await bookingService.listBookings(req.query);
    return ok(res, data);
  } catch (error) {
    return next(error);
  }
}

export async function listAvailableSlots(req, res, next) {
  try {
    const data = await bookingService.listAvailableSlots(req.query);
    return ok(res, data);
  } catch (error) {
    return next(error);
  }
}

export async function createBooking(req, res, next) {
  try {
    const data = await bookingService.createBooking(req.body);
    return ok(res, data, "Booking created");
  } catch (error) {
    return next(error);
  }
}

export async function cancelBooking(req, res, next) {
  try {
    const data = await bookingService.cancelBooking(req.params.uid);
    return ok(res, data, "Booking cancelled");
  } catch (error) {
    return next(error);
  }
}

export async function rescheduleBooking(req, res, next) {
  try {
    const data = await bookingService.rescheduleBooking(req.params.uid, req.body);
    return ok(res, data, "Booking rescheduled");
  } catch (error) {
    return next(error);
  }
}
