import Bill from "../models/Bill.js";
import MeterReading from "../models/MeterReading.js";
import { createBillData, renderBillPdf } from "../services/billService.js";
import { calculateBillByTariff } from "../utils/tariff.js";
import { ensureBiMonthlyBillingWindow } from "../utils/billingCycle.js";
import { getBiMonthlyCycleSerial, normalizeBiMonthlyCycleLabel } from "../utils/meterCycle.js";

export const generateBill = async (req, res) => {
  try {
    const { units, monthLabel, state, dueDate } = req.body;

    const parsedUnits = Number(units);
    if (!Number.isFinite(parsedUnits) || parsedUnits < 0) {
      return res.status(400).json({ message: "Enter a valid units value" });
    }

    const normalizedLabel = normalizeBiMonthlyCycleLabel((monthLabel || "").trim());
    if (!normalizedLabel) {
      return res.status(400).json({ message: "Use billing cycle label format like Jan-Feb 2026" });
    }

    const latestBill = await Bill.findOne({ user: req.user._id }).sort({ createdAt: -1 });
    if (latestBill) {
      const requestedSerial = getBiMonthlyCycleSerial(normalizedLabel);
      const lastBilledSerial = getBiMonthlyCycleSerial(latestBill.monthLabel);
      const isNewerCycle = requestedSerial !== null && lastBilledSerial !== null && requestedSerial > lastBilledSerial;

      if (!isNewerCycle) {
        const cycleCheck = ensureBiMonthlyBillingWindow({ lastBillDate: latestBill.createdAt });
        if (!cycleCheck.ok) {
          return res.status(400).json({
            message: `Bi-monthly billing only. Next bill can be generated after ${cycleCheck.nextEligibleDate.toDateString()}`,
            remainingDays: cycleCheck.remainingDays,
            nextEligibleDate: cycleCheck.nextEligibleDate
          });
        }
      }
    }

    const existingBill = await Bill.findOne({ user: req.user._id, monthLabel: normalizedLabel });
    if (existingBill) {
      return res.status(409).json({ message: `Bill for ${normalizedLabel} already generated`, bill: existingBill });
    }

    const billData = await createBillData({
      user: req.user,
      units: parsedUnits,
      monthLabel: normalizedLabel,
      state: state || req.user.state
    });

    const computedDueDate = dueDate ? new Date(dueDate) : new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);

    const saved = await Bill.create({
      user: req.user._id,
      monthLabel: billData.monthLabel,
      units: billData.units,
      amount: billData.total,
      state: billData.state,
      upiLink: billData.upiLink,
      qrDataUrl: billData.qrDataUrl,
      paymentStatus: "pending",
      dueDate: computedDueDate,
      reminderSentAt: null,
      reminderChannels: []
    });

    return res.status(201).json({ bill: saved, details: billData });
  } catch (error) {
    console.error("Error generating bill:", error);
    return res.status(500).json({ message: "Error generating bill", error: error.message });
  }
};

/**
 * Generate bill from meter reading (Preferred method following electricity company procedures)
 */
export const generateBillFromMeterReading = async (req, res) => {
  try {
    const { monthLabel, dueDate } = req.body;
    const normalizedLabel = normalizeBiMonthlyCycleLabel((monthLabel || "").trim());
    const labelCandidates = [monthLabel, normalizedLabel].filter(Boolean);

    if (!monthLabel) {
      return res.status(400).json({ message: "Month label is required" });
    }

    // Get meter reading for this cycle first
    const reading = await MeterReading.findOne({
      user: req.user._id,
      monthLabel: { $in: labelCandidates }
    });

    if (!reading) {
      return res.status(404).json({
        message: `No meter reading found for ${monthLabel}. Please record meter reading first.`
      });
    }

    const latestBill = await Bill.findOne({ user: req.user._id }).sort({ createdAt: -1 });

    if (latestBill) {
      const requestedSerial = getBiMonthlyCycleSerial(reading.monthLabel);
      const lastBilledSerial = getBiMonthlyCycleSerial(latestBill.monthLabel);
      const isNewerCycle = requestedSerial !== null && lastBilledSerial !== null && requestedSerial > lastBilledSerial;

      if (!isNewerCycle) {
        const cycleCheck = ensureBiMonthlyBillingWindow({ lastBillDate: latestBill.createdAt });
        if (!cycleCheck.ok) {
          return res.status(400).json({
            message: `Bi-monthly billing only. Next bill can be generated after ${cycleCheck.nextEligibleDate.toDateString()}`,
            remainingDays: cycleCheck.remainingDays,
            nextEligibleDate: cycleCheck.nextEligibleDate
          });
        }
      }
    }

    // Check if bill already exists for this month
    const existingBill = await Bill.findOne({
      user: req.user._id,
      monthLabel: reading.monthLabel
    });

    if (existingBill) {
      return res.status(400).json({
        message: `Bill for ${monthLabel} already generated`,
        bill: existingBill
      });
    }

    // Use the unitsConsumed from meter reading
    const units = reading.unitsConsumed;
    const state = reading.state;

    const billData = await createBillData({
      user: req.user,
      units,
      monthLabel: reading.monthLabel,
      state
    });

    const computedDueDate = dueDate ? new Date(dueDate) : new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);

    const saved = await Bill.create({
      user: req.user._id,
      monthLabel: billData.monthLabel,
      units: billData.units,
      amount: billData.total,
      state: billData.state,
      upiLink: billData.upiLink,
      qrDataUrl: billData.qrDataUrl,
      paymentStatus: "pending",
      dueDate: computedDueDate,
      reminderSentAt: null,
      reminderChannels: []
    });

    return res.status(201).json({
      message: "Bill generated from meter reading successfully",
      meterReading: reading,
      bill: saved,
      billDetails: billData
    });
  } catch (error) {
    console.error("Error generating bill from meter reading:", error);
    return res.status(500).json({
      message: "Error generating bill from meter reading",
      error: error.message
    });
  }
};

export const downloadBillPdf = async (req, res) => {
  const bill = await Bill.findOne({ _id: req.params.id, user: req.user._id });
  if (!bill) {
    return res.status(404).json({ message: "Bill not found" });
  }
  if (bill.paymentStatus !== "paid") {
    return res.status(400).json({ message: "Complete payment to download PDF" });
  }

  const recalculated = calculateBillByTariff(bill.units, bill.state);

  const billData = {
    customerName: req.user.name,
    customerEmail: req.user.email,
    consumerNumber: req.user.consumerNumber,
    monthLabel: bill.monthLabel,
    state: bill.state,
    units: bill.units,
    energyCharge: recalculated.energyCharge,
    fixedCharge: recalculated.fixedCharge,
    dutyPercent: recalculated.dutyPercent,
    total: bill.amount,
    upiLink: bill.upiLink
  };
  const pdfBuffer = await renderBillPdf(billData);

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename=bill-${bill.monthLabel}.pdf`);
  return res.send(pdfBuffer);
};

export const getBills = async (req, res) => {
  const bills = await Bill.find({ user: req.user._id }).sort({ createdAt: -1 });
  return res.json(bills);
};

export const markBillPaid = async (req, res) => {
  const { transactionId } = req.body;
  const bill = await Bill.findOne({ _id: req.params.id, user: req.user._id });
  if (!bill) {
    return res.status(404).json({ message: "Bill not found" });
  }
  if (bill.paymentStatus === "paid") {
    return res.json({ message: "Payment already completed", bill });
  }
  const tx = String(transactionId || "").trim();
  // Most UPI references/UTRs are 12-digit numeric values.
  if (!/^\d{12}$/.test(tx)) {
    return res.status(400).json({ message: "Enter a valid 12-digit UPI reference/UTR number" });
  }

  const duplicateTxBill = await Bill.findOne({ transactionId: tx });
  if (duplicateTxBill) {
    return res.status(409).json({ message: "This UPI reference is already used for another bill" });
  }

  bill.paymentStatus = "paid";
  bill.paidAt = new Date();
  bill.transactionId = tx;
  bill.reminderSentAt = null;
  bill.reminderChannels = [];
  await bill.save();

  return res.json({ message: "Payment successful", bill });
};
