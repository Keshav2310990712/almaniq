import * as availabilityService from "../services/availability.service.js";
import { ok } from "../lib/response.js";

export async function getAvailability(req, res, next) {
  try {
    const data = await availabilityService.getAvailability(req.query);
    return ok(res, data);
  } catch (error) {
    return next(error);
  }
}

export async function getAvailabilityHeatmap(req, res, next) {
  try {
    const data = await availabilityService.getAvailabilityHeatmap(req.query);
    return ok(res, data);
  } catch (error) {
    return next(error);
  }
}

export async function createAvailability(req, res, next) {
  try {
    const data = await availabilityService.createAvailability(req.body);
    return ok(res, data, "Availability saved");
  } catch (error) {
    return next(error);
  }
}

export async function updateBreakMode(req, res, next) {
  try {
    const data = await availabilityService.updateBreakMode(req.body);
    return ok(res, data, "Break mode updated");
  } catch (error) {
    return next(error);
  }
}
