import nodemailer from "nodemailer";

const canSend = process.env.EMAIL_ALERTS_ENABLED === "true";

export const sendAlertEmail = async ({ to, subject, text }) => {
  if (!canSend) {
    return { skipped: true };
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  await transporter.sendMail({
    from: process.env.SMTP_USER,
    to,
    subject,
    text
  });

  return { sent: true };
};
