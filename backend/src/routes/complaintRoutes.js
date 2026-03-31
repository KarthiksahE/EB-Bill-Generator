import { Router } from "express";
import {
  createComplaint,
  forwardComplaintToDiscom,
  getComplaintById,
  getComplaints,
  getComplaintStats,
  submitComplaintFeedback,
  updateComplaintStatus
} from "../controllers/complaintController.js";

const router = Router();

router.get("/stats", getComplaintStats);
router.post("/", createComplaint);
router.get("/", getComplaints);
router.get("/:id", getComplaintById);
router.patch("/:id/status", updateComplaintStatus);
router.patch("/:id/forward-discom", forwardComplaintToDiscom);
router.patch("/:id/feedback", submitComplaintFeedback);

export default router;
