import MeterReading from "../models/MeterReading.js";
import Bill from "../models/Bill.js";
import { ensureBiMonthlyBillingWindow } from "../utils/billingCycle.js";
import {
  formatBiMonthlyCycleLabel,
  getBiMonthlyCycleSerial,
  getNextBiMonthlyCycleLabel,
  normalizeBiMonthlyCycleLabel
} from "../utils/meterCycle.js";

const parseReadingValue = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }
  return parsed;
};

/**
 * Record a new meter reading
 * Following standard electricity company procedure:
 * 1. Record current reading
 * 2. Fetch previous reading
 * 3. Calculate units consumed
 * 4. Validate reading
 */
export const recordMeterReading = async (req, res) => {
  try {
    const { readingValue, monthLabel, state, remarks, meterStatus } = req.body;
    const parsedReadingValue = parseReadingValue(readingValue);
    const rawLabel = (monthLabel || "").trim();
    const normalizedLabel = normalizeBiMonthlyCycleLabel(rawLabel) || formatBiMonthlyCycleLabel(new Date());

    // Validate input
    if (parsedReadingValue === null) {
      return res.status(400).json({ message: "Invalid meter reading value" });
    }

    if (rawLabel && !normalizeBiMonthlyCycleLabel(rawLabel)) {
      return res.status(400).json({
        message: "Invalid billing cycle label. Use bi-monthly format like Jan-Feb 2026"
      });
    }

    if ((meterStatus === "tampered" || meterStatus === "faulty") && !String(remarks || "").trim()) {
      return res.status(400).json({
        message: "Remarks are required when meter status is tampered or faulty"
      });
    }

    // Check if reading already exists for this billing cycle
    const existingReading = await MeterReading.findOne({
      user: req.user._id,
      monthLabel: normalizedLabel
    });

    if (existingReading) {
      return res.status(409).json({
        message: `Reading for ${normalizedLabel} already recorded`,
        reading: existingReading
      });
    }

    // Get previous month's reading
    const previousReading = await MeterReading.findOne({
      user: req.user._id
    }).sort({ date: -1 });

    const prevReadingValue = previousReading?.readingValue || 0;

    // Validate reading is not going backwards (anti-tamper check)
    if (parsedReadingValue < prevReadingValue) {
      return res.status(400).json({
        message: "Meter reading cannot be less than previous reading (possible meter tampering)",
        previousReading: prevReadingValue,
        currentReading: parsedReadingValue
      });
    }

    // Create new meter reading
    const newReading = new MeterReading({
      user: req.user._id,
      readingValue: parsedReadingValue,
      previousReading: prevReadingValue,
      monthLabel: normalizedLabel,
      state: state || req.user.state,
      remarks: remarks || "",
      meterStatus: meterStatus || "normal",
      date: new Date()
    });

    await newReading.save();

    // Calculate units consumed (auto-calculated in pre-save hook)
    const unitsConsumed = parsedReadingValue - prevReadingValue;

    return res.status(201).json({
      message: "Meter reading recorded successfully",
      reading: newReading,
      calculation: {
        currentReading: parsedReadingValue,
        previousReading: prevReadingValue,
        unitsConsumed,
        monthLabel: normalizedLabel
      }
    });
  } catch (error) {
    console.error("Error recording meter reading:", error);
    if (error?.code === 11000) {
      return res.status(409).json({ message: "Reading already exists for this billing cycle" });
    }
    return res.status(500).json({ message: "Error recording meter reading", error: error.message });
  }
};

export const getBillingCycleInfo = async (req, res) => {
  try {
    const latestReading = await MeterReading.findOne({ user: req.user._id }).sort({ date: -1 });
    const currentCycle = formatBiMonthlyCycleLabel();

    if (!latestReading) {
      return res.json({
        currentCycle,
        suggestedCycle: currentCycle,
        nextCycle: getNextBiMonthlyCycleLabel(currentCycle),
        latestReading: null
      });
    }

    return res.json({
      currentCycle,
      suggestedCycle: getNextBiMonthlyCycleLabel(latestReading.monthLabel),
      nextCycle: getNextBiMonthlyCycleLabel(latestReading.monthLabel),
      latestReading
    });
  } catch (error) {
    console.error("Error fetching billing cycle info:", error);
    return res.status(500).json({ message: "Error fetching billing cycle info", error: error.message });
  }
};

/**
 * Get all meter readings for the current user
 */
export const getMeterReadings = async (req, res) => {
  try {
    const readings = await MeterReading.find({ user: req.user._id }).sort({ date: -1 });

    return res.json({
      message: "Meter readings retrieved successfully",
      totalReadings: readings.length,
      readings
    });
  } catch (error) {
    console.error("Error fetching meter readings:", error);
    return res.status(500).json({ message: "Error fetching meter readings", error: error.message });
  }
};

/**
 * Get meter reading for a specific month
 */
export const getMeterReadingByMonth = async (req, res) => {
  try {
    const { monthLabel } = req.params;

    const reading = await MeterReading.findOne({
      user: req.user._id,
      monthLabel
    });

    if (!reading) {
      return res.status(404).json({
        message: `No meter reading found for ${monthLabel}`
      });
    }

    return res.json({
      message: "Meter reading retrieved successfully",
      reading
    });
  } catch (error) {
    console.error("Error fetching meter reading:", error);
    return res.status(500).json({ message: "Error fetching meter reading", error: error.message });
  }
};

/**
 * Get latest meter reading
 */
export const getLatestMeterReading = async (req, res) => {
  try {
    const reading = await MeterReading.findOne({ user: req.user._id }).sort({ date: -1 });

    if (!reading) {
      return res.status(404).json({
        message: "No meter reading recorded yet"
      });
    }

    return res.json({
      message: "Latest meter reading retrieved successfully",
      reading
    });
  } catch (error) {
    console.error("Error fetching latest meter reading:", error);
    return res.status(500).json({
      message: "Error fetching latest meter reading",
      error: error.message
    });
  }
};

/**
 * Generate bill from meter readings
 * This replaces the manual units input with automatic calculation from meter readings
 */
export const generateBillFromReading = async (req, res) => {
  try {
    const { monthLabel, dueDate } = req.body;
    const normalizedLabel = normalizeBiMonthlyCycleLabel((monthLabel || "").trim());
    const labelCandidates = [monthLabel, normalizedLabel].filter(Boolean);

    // Fetch reading first so cycle sequence can be validated accurately.
    const reading = await MeterReading.findOne({
      user: req.user._id,
      monthLabel: { $in: labelCandidates }
    });

    if (!reading) {
      return res.status(404).json({
        message: `No meter reading found for ${monthLabel || normalizedLabel || "selected cycle"}`
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
        message: `Bill for ${reading.monthLabel} already generated`,
        bill: existingBill
      });
    }

    // Use the unitsConsumed from meter reading
    const units = reading.unitsConsumed;
    const state = reading.state;

    // Import billService here to avoid circular dependency
    const { createBillData } = await import("../services/billService.js");

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
      reading,
      bill: saved,
      billDetails: billData
    });
  } catch (error) {
    console.error("Error generating bill from reading:", error);
    return res.status(500).json({
      message: "Error generating bill from reading",
      error: error.message
    });
  }
};

/**
 * Update meter reading (admin/support function)
 * Allows correction of reading errors
 */
export const updateMeterReading = async (req, res) => {
  try {
    const { id } = req.params;
    const { readingValue, remarks, meterStatus } = req.body;

    const reading = await MeterReading.findOne({
      _id: id,
      user: req.user._id
    });

    if (!reading) {
      return res.status(404).json({ message: "Meter reading not found" });
    }

    // Check if bill is already generated from this reading
    const bill = await Bill.findOne({
      user: req.user._id,
      monthLabel: reading.monthLabel
    });

    if (bill && bill.paymentStatus === "paid") {
      return res.status(400).json({
        message: "Cannot update reading - bill already paid for this month"
      });
    }

    // Update reading
    if (readingValue !== undefined) {
      const parsedReadingValue = parseReadingValue(readingValue);
      if (parsedReadingValue === null) {
        return res.status(400).json({ message: "Invalid meter reading value" });
      }
      if (parsedReadingValue < reading.previousReading) {
        return res.status(400).json({
          message: "Meter reading cannot be less than previous reading",
          previousReading: reading.previousReading
        });
      }
      reading.readingValue = parsedReadingValue;
      reading.unitsConsumed = Math.max(0, parsedReadingValue - reading.previousReading);
    }

    if (remarks !== undefined) {
      reading.remarks = remarks;
    }

    if (meterStatus !== undefined) {
      reading.meterStatus = meterStatus;
    }

    await reading.save();

    return res.json({
      message: "Meter reading updated successfully",
      reading
    });
  } catch (error) {
    console.error("Error updating meter reading:", error);
    return res.status(500).json({
      message: "Error updating meter reading",
      error: error.message
    });
  }
};

/**
 * Delete meter reading (admin/support function)
 */
export const deleteMeterReading = async (req, res) => {
  try {
    const { id } = req.params;

    const reading = await MeterReading.findOne({
      _id: id,
      user: req.user._id
    });

    if (!reading) {
      return res.status(404).json({ message: "Meter reading not found" });
    }

    // Check if bill is already generated
    const bill = await Bill.findOne({
      user: req.user._id,
      monthLabel: reading.monthLabel
    });

    if (bill) {
      return res.status(400).json({
        message: "Cannot delete reading - bill already generated for this month"
      });
    }

    await MeterReading.deleteOne({ _id: id });

    return res.json({
      message: "Meter reading deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting meter reading:", error);
    return res.status(500).json({
      message: "Error deleting meter reading",
      error: error.message
    });
  }
};
