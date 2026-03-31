import { Router } from "express";
import {
  createUsage,
  getDashboardSummary,
  getUsageHistory,
  predictUsage
} from "../controllers/usageController.js";

const router = Router();

router.post("/", createUsage);
router.get("/", getUsageHistory);
router.post("/predict", predictUsage);
router.get("/dashboard", getDashboardSummary);

export default router;
