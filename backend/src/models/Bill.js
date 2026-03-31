import mongoose from "mongoose";

const billSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    monthLabel: { type: String, required: true },
    units: { type: Number, required: true },
    amount: { type: Number, required: true },
    state: { type: String, required: true },
    upiLink: { type: String, required: true },
    qrDataUrl: { type: String, required: true },
    paymentStatus: { type: String, enum: ["pending", "paid"], default: "pending" },
    paidAt: { type: Date },
    transactionId: { type: String },
    dueDate: { type: Date, required: true },
    reminderSentAt: { type: Date },
    reminderChannels: { type: [String], default: [] }
  },
  { timestamps: true }
);

export default mongoose.model("Bill", billSchema);
