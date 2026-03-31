import { Router } from "express";
import { getAppliances, upsertAppliances } from "../controllers/applianceController.js";

const router = Router();

router.get("/", getAppliances);
router.put("/", upsertAppliances);

export default router;
