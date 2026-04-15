import * as eventTypeService from "../services/eventTypes.service.js";
import { ok } from "../lib/response.js";

export async function listEventTypes(req, res, next) {
  try {
    const data = await eventTypeService.listEventTypes(req.query);
    return ok(res, data);
  } catch (error) {
    return next(error);
  }
}

export async function createEventType(req, res, next) {
  try {
    const data = await eventTypeService.createEventType(req.body);
    return ok(res, data, "Event type created");
  } catch (error) {
    return next(error);
  }
}

export async function updateEventType(req, res, next) {
  try {
    const data = await eventTypeService.updateEventType(req.params.id, req.body);
    return ok(res, data, "Event type updated");
  } catch (error) {
    return next(error);
  }
}

export async function deleteEventType(req, res, next) {
  try {
    const data = await eventTypeService.deleteEventType(req.params.id);
    return ok(res, data, "Event type deleted");
  } catch (error) {
    return next(error);
  }
}
