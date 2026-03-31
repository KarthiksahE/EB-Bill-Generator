import Bill from "../models/Bill.js";
import { sendAlertEmail } from "../utils/email.js";

const sendWhatsAppReminder = async ({ user, bill }) => {
  if (process.env.ENABLE_WHATSAPP_REMINDER !== "true") {
    return { skipped: true };
  }
  // Placeholder hook for integrating a provider such as Twilio or Gupshup.
  console.log(`WhatsApp reminder placeholder for ${user.email} bill ${bill._id}`);
  return { sent: true };
};

const processDueBills = async () => {
  const reminderDays = Number(process.env.REMINDER_DAYS_BEFORE_DUE || 2);
  const now = new Date();
  const upperBound = new Date(now.getTime() + reminderDays * 24 * 60 * 60 * 1000);

  const dueBills = await Bill.find({
    paymentStatus: "pending",
    dueDate: { $gte: now, $lte: upperBound },
    reminderSentAt: null
  }).populate("user");

  for (const bill of dueBills) {
    const channels = [];
    const user = bill.user;

    if (user?.email) {
      await sendAlertEmail({
        to: user.email,
        subject: `EB Bill Reminder: Due on ${new Date(bill.dueDate).toLocaleDateString("en-IN")}`,
        text: `Hi ${user.name}, your bill for ${bill.monthLabel} amount Rs ${bill.amount} is due on ${new Date(
          bill.dueDate
        ).toLocaleDateString("en-IN")}. Please complete payment on time.`
      });
      channels.push("email");
    }

    const whatsapp = await sendWhatsAppReminder({ user, bill });
    if (whatsapp.sent) {
      channels.push("whatsapp");
    }

    bill.reminderSentAt = new Date();
    bill.reminderChannels = channels;
    await bill.save();
  }
};

export const startReminderScheduler = () => {
  // Run immediately once, then every hour.
  processDueBills().catch((error) => console.error("Reminder scheduler error", error));
  setInterval(async () => {
    try {
      await processDueBills();
    } catch (error) {
      console.error("Reminder scheduler error", error);
    }
  }, 60 * 60 * 1000);

  console.log("Reminder scheduler started");
};
