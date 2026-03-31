import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const createToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });
const createConsumerNumber = () => `EB${Date.now()}${Math.floor(100 + Math.random() * 900)}`;

const getUniqueConsumerNumber = async () => {
  let consumerNumber = createConsumerNumber();
  while (await User.exists({ consumerNumber })) {
    consumerNumber = createConsumerNumber();
  }
  return consumerNumber;
};

export const signup = async (req, res) => {
  const { name, email, password, state, city, address, pincode } = req.body;

  if (!city || !String(city).trim()) {
    return res.status(400).json({ message: "City is required" });
  }

  if (!address || !String(address).trim()) {
    return res.status(400).json({ message: "Address is required" });
  }

  if (!/^\d{6}$/.test(String(pincode || "").trim())) {
    return res.status(400).json({ message: "Pincode must be a valid 6-digit number" });
  }

  const existing = await User.findOne({ email });
  if (existing) {
    return res.status(400).json({ message: "Email already exists" });
  }

  const hash = await bcrypt.hash(password, 10);
  const consumerNumber = await getUniqueConsumerNumber();
  const user = await User.create({
    name,
    email,
    password: hash,
    state,
    city: String(city).trim(),
    address: String(address).trim(),
    pincode: String(pincode).trim(),
    consumerNumber
  });
  const token = createToken(user._id);
  return res.status(201).json({
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      state: user.state,
      city: user.city,
      address: user.address,
      pincode: user.pincode,
      consumerNumber: user.consumerNumber
    }
  });
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(400).json({ message: "Invalid credentials" });
  }
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) {
    return res.status(400).json({ message: "Invalid credentials" });
  }

  if (!user.consumerNumber) {
    user.consumerNumber = await getUniqueConsumerNumber();
    await user.save();
  }

  const token = createToken(user._id);
  return res.json({
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      state: user.state,
      city: user.city || "",
      address: user.address || "",
      pincode: user.pincode || "",
      consumerNumber: user.consumerNumber
    }
  });
};

export const me = async (req, res) => res.json({ user: req.user });

export const updateProfile = async (req, res) => {
  const { name, city, address, pincode, state } = req.body;

  if (!name || !String(name).trim()) {
    return res.status(400).json({ message: "Name is required" });
  }

  if (!city || !String(city).trim()) {
    return res.status(400).json({ message: "City is required" });
  }

  if (!address || !String(address).trim()) {
    return res.status(400).json({ message: "Address is required" });
  }

  if (!/^\d{6}$/.test(String(pincode || "").trim())) {
    return res.status(400).json({ message: "Pincode must be a valid 6-digit number" });
  }

  const user = await User.findById(req.user._id);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  user.name = String(name).trim();
  user.city = String(city).trim();
  user.address = String(address).trim();
  user.pincode = String(pincode).trim();
  if (state) {
    user.state = state;
  }

  await user.save();

  return res.json({
    message: "Profile updated successfully",
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      state: user.state,
      city: user.city,
      address: user.address,
      pincode: user.pincode,
      consumerNumber: user.consumerNumber
    }
  });
};
