import Complaint from "../models/Complaint.js";

const TYPE_PRIORITY_MAP = {
  billing_dispute: "high",
  meter_malfunction: "critical",
  duplicate_billing: "high",
  bill_correction: "medium",
  payment_not_credited: "high",
  other: "medium"
};

const addDays = (date, days) => new Date(new Date(date).getTime() + days * 24 * 60 * 60 * 1000);

export const createComplaint = async (req, res) => {
  try {
    const { type, title, description, attachments = [], billId, meterReadingId } = req.body;

    if (!type || !title || !description) {
      return res.status(400).json({ message: "type, title and description are required" });
    }

    const complaint = await Complaint.create({
      user: req.user._id,
      bill: billId || undefined,
      meterReading: meterReadingId || undefined,
      type,
      title,
      description,
      attachments,
      priority: TYPE_PRIORITY_MAP[type] || "medium",
      slaDueAt: addDays(new Date(), 15),
      timeline: [
        {
          action: "created",
          note: "Complaint submitted by user",
          by: String(req.user._id)
        }
      ]
    });

    return res.status(201).json({
      message: "Complaint created successfully",
      complaint
    });
  } catch (error) {
    console.error("createComplaint error", error);
    return res.status(500).json({ message: "Unable to create complaint", error: error.message });
  }
};

export const getComplaints = async (req, res) => {
  try {
    const { status, type } = req.query;
    const query = { user: req.user._id };

    if (status) {
      query.status = status;
    }
    if (type) {
      query.type = type;
    }

    const complaints = await Complaint.find(query).sort({ createdAt: -1 });
    return res.json(complaints);
  } catch (error) {
    console.error("getComplaints error", error);
    return res.status(500).json({ message: "Unable to fetch complaints", error: error.message });
  }
};

export const getComplaintById = async (req, res) => {
  try {
    const complaint = await Complaint.findOne({ _id: req.params.id, user: req.user._id });
    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found" });
    }
    return res.json(complaint);
  } catch (error) {
    console.error("getComplaintById error", error);
    return res.status(500).json({ message: "Unable to fetch complaint", error: error.message });
  }
};

export const updateComplaintStatus = async (req, res) => {
  try {
    const { status, assignedTo, resolutionSummary } = req.body;
    const complaint = await Complaint.findOne({ _id: req.params.id, user: req.user._id });

    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    if (!status || !["open", "assigned", "resolved", "closed"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    complaint.status = status;

    if (assignedTo !== undefined) {
      complaint.assignedTo = String(assignedTo || "");
    }

    if (status === "assigned" && !complaint.firstResponseAt) {
      complaint.firstResponseAt = new Date();
    }

    if (status === "resolved") {
      complaint.resolvedAt = new Date();
      complaint.resolutionSummary = resolutionSummary || complaint.resolutionSummary;
    }

    if (status === "closed") {
      complaint.closedAt = new Date();
      complaint.resolutionSummary = resolutionSummary || complaint.resolutionSummary;
    }

    complaint.timeline.push({
      action: `status_changed_to_${status}`,
      note: resolutionSummary || "Status updated",
      by: String(req.user._id)
    });

    await complaint.save();

    return res.json({
      message: "Complaint status updated",
      complaint
    });
  } catch (error) {
    console.error("updateComplaintStatus error", error);
    return res.status(500).json({ message: "Unable to update complaint status", error: error.message });
  }
};

export const forwardComplaintToDiscom = async (req, res) => {
  try {
    const { discomReference = "", note = "Forwarded to DISCOM" } = req.body;
    const complaint = await Complaint.findOne({ _id: req.params.id, user: req.user._id });

    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    complaint.discomForwarded = true;
    complaint.discomReference = discomReference;

    if (complaint.status === "open") {
      complaint.status = "assigned";
    }

    complaint.timeline.push({
      action: "forwarded_to_discom",
      note,
      by: String(req.user._id)
    });

    await complaint.save();

    return res.json({
      message: "Complaint forwarded to DISCOM queue",
      complaint
    });
  } catch (error) {
    console.error("forwardComplaintToDiscom error", error);
    return res.status(500).json({ message: "Unable to forward complaint", error: error.message });
  }
};

export const submitComplaintFeedback = async (req, res) => {
  try {
    const { rating, feedback = "" } = req.body;
    const complaint = await Complaint.findOne({ _id: req.params.id, user: req.user._id });

    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    if (!["resolved", "closed"].includes(complaint.status)) {
      return res.status(400).json({ message: "Feedback can be submitted only after resolution" });
    }

    if (!rating || Number(rating) < 1 || Number(rating) > 5) {
      return res.status(400).json({ message: "rating must be between 1 and 5" });
    }

    complaint.rating = Number(rating);
    complaint.feedback = feedback;
    complaint.timeline.push({
      action: "feedback_submitted",
      note: `Rating ${rating}/5`,
      by: String(req.user._id)
    });

    await complaint.save();

    return res.json({ message: "Feedback submitted", complaint });
  } catch (error) {
    console.error("submitComplaintFeedback error", error);
    return res.status(500).json({ message: "Unable to submit feedback", error: error.message });
  }
};

export const getComplaintStats = async (req, res) => {
  try {
    const now = new Date();
    const userFilter = { user: req.user._id };

    const [total, open, assigned, resolved, closed, overdue] = await Promise.all([
      Complaint.countDocuments(userFilter),
      Complaint.countDocuments({ ...userFilter, status: "open" }),
      Complaint.countDocuments({ ...userFilter, status: "assigned" }),
      Complaint.countDocuments({ ...userFilter, status: "resolved" }),
      Complaint.countDocuments({ ...userFilter, status: "closed" }),
      Complaint.countDocuments({
        ...userFilter,
        status: { $in: ["open", "assigned"] },
        slaDueAt: { $lt: now }
      })
    ]);

    return res.json({ total, open, assigned, resolved, closed, overdue });
  } catch (error) {
    console.error("getComplaintStats error", error);
    return res.status(500).json({ message: "Unable to fetch complaint stats", error: error.message });
  }
};
