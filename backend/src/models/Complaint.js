import mongoose from "mongoose";

const complaintTimelineSchema = new mongoose.Schema(
  {
    action: { type: String, required: true },
    note: { type: String, default: "" },
    by: { type: String, default: "system" },
    at: { type: Date, default: Date.now }
  },
  { _id: false }
);

const complaintSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    bill: { type: mongoose.Schema.Types.ObjectId, ref: "Bill" },
    meterReading: { type: mongoose.Schema.Types.ObjectId, ref: "MeterReading" },
    type: {
      type: String,
      enum: [
        "billing_dispute",
        "meter_malfunction",
        "duplicate_billing",
        "bill_correction",
        "payment_not_credited",
        "other"
      ],
      required: true
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    attachments: { type: [String], default: [] },
    status: { type: String, enum: ["open", "assigned", "resolved", "closed"], default: "open" },
    priority: { type: String, enum: ["low", "medium", "high", "critical"], default: "medium" },
    assignedQueue: { type: String, default: "DISCOM_QUEUE" },
    assignedTo: { type: String, default: "" },
    discomForwarded: { type: Boolean, default: false },
    discomReference: { type: String, default: "" },
    slaDueAt: { type: Date, required: true },
    firstResponseAt: { type: Date },
    resolvedAt: { type: Date },
    closedAt: { type: Date },
    resolutionSummary: { type: String, default: "" },
    rating: { type: Number, min: 1, max: 5 },
    feedback: { type: String, default: "" },
    timeline: { type: [complaintTimelineSchema], default: [] }
  },
  { timestamps: true }
);

complaintSchema.index({ user: 1, status: 1, createdAt: -1 });
complaintSchema.index({ slaDueAt: 1, status: 1 });

export default mongoose.model("Complaint", complaintSchema);
