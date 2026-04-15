import * as slotsService from "../services/slots.service.js";
import { ok } from "../lib/response.js";

export async function listSlots(req, res, next) {
  try {
    const data = await slotsService.listSlots(req.query);
    return ok(res, data);
  } catch (error) {
    return next(error);
  }
}
