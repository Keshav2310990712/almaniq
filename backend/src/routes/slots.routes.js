import { Router } from "express";
import * as slotsController from "../controllers/slots.controller.js";

const router = Router();

router.get("/", slotsController.listSlots);

export default router;
