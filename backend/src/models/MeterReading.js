import mongoose from "mongoose";

const meterReadingSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: Date, required: true, default: Date.now },
    monthLabel: { type: String, required: true }, // e.g., "March 2026"
    readingValue: { type: Number, required: true }, // Current meter reading in kWh
    previousReading: { type: Number, default: 0 }, // Previous month's reading
    unitsConsumed: { type: Number, default: 0 }, // Auto-calculated: readingValue - previousReading
    state: { type: String, required: true },
    remarks: { type: String, default: "" }, // e.g., "Initial reading" or any notes
    meterStatus: { type: String, enum: ["normal", "tampered", "faulty"], default: "normal" },
    readingType: { type: String, enum: ["manual", "automatic"], default: "manual" }
  },
  { timestamps: true }
);

// Index for efficient queries
meterReadingSchema.index({ user: 1, monthLabel: 1 }, { unique: true });
meterReadingSchema.index({ user: 1, date: -1 });

// Pre-save hook to calculate unitsConsumed
meterReadingSchema.pre("save", function (next) {
  if (this.readingValue && this.previousReading !== undefined) {
    this.unitsConsumed = Math.max(0, this.readingValue - this.previousReading);
  }
  next();
});

export default mongoose.model("MeterReading", meterReadingSchema);
