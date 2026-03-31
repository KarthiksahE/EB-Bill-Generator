import express from "express";
import {
  recordMeterReading,
  getMeterReadings,
  getMeterReadingByMonth,
  getLatestMeterReading,
  getBillingCycleInfo,
  generateBillFromReading,
  updateMeterReading,
  deleteMeterReading
} from "../controllers/meterController.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * Record a new meter reading
 * POST /api/meter/record
 * Body: { readingValue, monthLabel, state, remarks, meterStatus }
 */
router.post("/record", recordMeterReading);

/**
 * Get all meter readings for current user
 * GET /api/meter/all
 */
router.get("/all", getMeterReadings);

/**
 * Get latest meter reading
 * GET /api/meter/latest
 */
router.get("/latest", getLatestMeterReading);

/**
 * Get recommended bi-monthly cycle labels
 * GET /api/meter/cycle-info
 */
router.get("/cycle-info", getBillingCycleInfo);

/**
 * Get meter reading for a specific month
 * GET /api/meter/:monthLabel
 */
router.get("/:monthLabel", getMeterReadingByMonth);

/**
 * Generate bill from meter reading
 * POST /api/meter/bill
 * Body: { monthLabel, dueDate (optional) }
 */
router.post("/bill/generate", generateBillFromReading);

/**
 * Update meter reading (only before bill payment)
 * PUT /api/meter/:id
 * Body: { readingValue, remarks, meterStatus }
 */
router.put("/:id", updateMeterReading);

/**
 * Delete meter reading (only if bill not generated)
 * DELETE /api/meter/:id
 */
router.delete("/:id", deleteMeterReading);

export default router;
