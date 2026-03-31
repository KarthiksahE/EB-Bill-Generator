import Alert from "../models/Alert.js";

export const getAlerts = async (req, res) => {
  const alerts = await Alert.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(30);
  return res.json(alerts);
};

export const markAlertRead = async (req, res) => {
  const alert = await Alert.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { isRead: true },
    { new: true }
  );
  if (!alert) {
    return res.status(404).json({ message: "Alert not found" });
  }
  return res.json(alert);
};
