import mongoose from "mongoose";

const generateConsumerNumber = () => `EB${Date.now()}${Math.floor(100 + Math.random() * 900)}`;

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    consumerNumber: {
      type: String,
      unique: true,
      required: true,
      default: generateConsumerNumber
    },
    state: { type: String, default: "Tamil Nadu" },
    city: { type: String, default: "" },
    address: { type: String, default: "" },
    pincode: { type: String, default: "" },
    monthlyThreshold: { type: Number, default: 300 },
    emailNotifications: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
