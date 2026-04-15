import { Router } from "express";
import * as eventTypeController from "../controllers/eventTypes.controller.js";

const router = Router();

router.get("/", eventTypeController.listEventTypes);
router.post("/", eventTypeController.createEventType);
router.patch("/:id", eventTypeController.updateEventType);
router.delete("/:id", eventTypeController.deleteEventType);

export default router;
