import Alert from "../models/Alert.js";
import { sendAlertEmail } from "../utils/email.js";

export const evaluateAndCreateAlerts = async ({ user, currentUnits, previousUnits, predictedBill }) => {
  const alerts = [];
  const threshold = user.monthlyThreshold || 300;
  const highBillThreshold = Number(process.env.HIGH_BILL_THRESHOLD || 2500);
  const spikePercent = Number(process.env.SPIKE_PERCENT_THRESHOLD || 30);

  if (currentUnits > threshold) {
    alerts.push({
      type: "THRESHOLD_EXCEEDED",
      message: `Usage crossed threshold: ${currentUnits} units (threshold ${threshold})`,
      severity: "warning"
    });
  }

  if (predictedBill > highBillThreshold) {
    alerts.push({
      type: "HIGH_PREDICTED_BILL",
      message: `Predicted bill is high: Rs ${predictedBill}`,
      severity: "critical"
    });
  }

  if (previousUnits > 0) {
    const increasePercent = ((currentUnits - previousUnits) / previousUnits) * 100;
    if (increasePercent >= spikePercent) {
      alerts.push({
        type: "SUDDEN_SPIKE",
        message: `Sudden spike detected: ${increasePercent.toFixed(1)}% higher than previous month`,
        severity: "critical"
      });
    }
  }

  if (alerts.length === 0) {
    alerts.push({
      type: "ALL_GOOD",
      message: "Usage pattern looks normal this month.",
      severity: "info"
    });
  }

  const saved = await Alert.insertMany(
    alerts.map((a) => ({
      ...a,
      user: user._id
    }))
  );

  if (user.emailNotifications) {
    for (const alert of alerts) {
      await sendAlertEmail({
        to: user.email,
        subject: `Smart EB Alert: ${alert.type}`,
        text: alert.message
      });
    }
  }

  return saved;
};
