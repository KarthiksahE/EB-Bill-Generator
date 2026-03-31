import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import { calculateBillByTariff } from "../utils/tariff.js";

export const generateUpiLink = ({ upiId, amount, name, note }) =>
  `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(name)}&am=${encodeURIComponent(
    amount
  )}&tn=${encodeURIComponent(note)}&cu=INR`;

export const createBillData = async ({ user, units, monthLabel, state }) => {
  const bill = calculateBillByTariff(units, state);
  const upiId = process.env.UPI_ID || "demo@upi";
  const upiLink = generateUpiLink({
    upiId,
    amount: bill.total,
    name: "Smart Electricity Billing",
    note: `${monthLabel} EB Bill`
  });
  const qrDataUrl = await QRCode.toDataURL(upiLink);

  return {
    ...bill,
    units,
    monthLabel,
    state,
    upiLink,
    qrDataUrl,
    customerName: user.name,
    customerEmail: user.email,
    consumerNumber: user.consumerNumber
  };
};

export const renderBillPdf = (billData) =>
  new Promise((resolve) => {
    const doc = new PDFDocument({ margin: 40 });
    const buffers = [];
    doc.on("data", (chunk) => buffers.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(buffers)));

    doc.fontSize(20).text("Smart Electricity Billing Receipt", { align: "center" });
    doc.moveDown();
    doc.fontSize(12).text(`Name: ${billData.customerName}`);
    doc.text(`Email: ${billData.customerEmail}`);
    doc.text(`Consumer No: ${billData.consumerNumber || "N/A"}`);
    doc.text(`Month: ${billData.monthLabel}`);
    doc.text(`State: ${billData.state}`);
    doc.text(`Units: ${billData.units}`);
    doc.moveDown();
    doc.text(`Energy Charge: Rs ${billData.energyCharge}`);
    doc.text(`Fixed Charge: Rs ${billData.fixedCharge}`);
    doc.text(`Duty: ${billData.dutyPercent}%`);
    doc.fontSize(14).text(`Total Amount: Rs ${billData.total}`, { underline: true });
    doc.moveDown();
    doc.fontSize(10).text("Scan QR or use UPI link to pay:");
    doc.text(billData.upiLink, { link: billData.upiLink, underline: true });
    doc.end();
  });
