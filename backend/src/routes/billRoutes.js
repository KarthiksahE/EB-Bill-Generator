import { Router } from "express";
import { downloadBillPdf, generateBill, getBills, markBillPaid, generateBillFromMeterReading } from "../controllers/billController.js";

const router = Router();

router.post("/", generateBill);
router.post("/from-reading", generateBillFromMeterReading);
router.get("/", getBills);
router.post("/:id/pay", markBillPaid);
router.get("/:id/pdf", downloadBillPdf);

export default router;
