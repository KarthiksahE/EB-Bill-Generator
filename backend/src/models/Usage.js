import mongoose from "mongoose";

const usageSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: Date, required: true },
    monthLabel: { type: String, required: true },
    units: { type: Number, required: true },
    billAmount: { type: Number, required: true },
    state: { type: String, required: true }
  },
  { timestamps: true }
);

export default mongoose.model("Usage", usageSchema);
