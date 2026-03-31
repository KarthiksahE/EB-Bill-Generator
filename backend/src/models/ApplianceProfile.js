import mongoose from "mongoose";

const applianceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    watt: { type: Number, required: true },
    hoursPerDay: { type: Number, required: true },
    quantity: { type: Number, default: 1 }
  },
  { _id: false }
);

const applianceProfileSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    appliances: { type: [applianceSchema], default: [] }
  },
  { timestamps: true }
);

export default mongoose.model("ApplianceProfile", applianceProfileSchema);
