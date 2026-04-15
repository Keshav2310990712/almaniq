import { Router } from "express";
import * as availabilityController from "../controllers/availability.controller.js";

const router = Router();

router.get("/heatmap", availabilityController.getAvailabilityHeatmap);
router.get("/", availabilityController.getAvailability);
router.patch("/break", availabilityController.updateBreakMode);
router.post("/", availabilityController.createAvailability);

export default router;
