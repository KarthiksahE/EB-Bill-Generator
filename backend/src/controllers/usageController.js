import Usage from "../models/Usage.js";
import User from "../models/User.js";
import { calculateBillByTariff } from "../utils/tariff.js";
import { predictNextMonthUnits } from "../utils/regression.js";
import { calculateGreenEnergyScore } from "../utils/greenScore.js";
import { evaluateAndCreateAlerts } from "../services/alertService.js";

export const createUsage = async (req, res) => {
  const { units, monthLabel, date, state } = req.body;
  const activeState = state || req.user.state;
  const bill = calculateBillByTariff(Number(units), activeState);

  const usage = await Usage.create({
    user: req.user._id,
    units: Number(units),
    monthLabel,
    date: date ? new Date(date) : new Date(),
    state: activeState,
    billAmount: bill.total
  });

  const history = await Usage.find({ user: req.user._id }).sort({ date: 1 }).limit(6);
  const historyUnits = history.map((h) => h.units);
  const predictedUnits = historyUnits.length >= 2 ? predictNextMonthUnits(historyUnits) : Number(units);
  const predictedBill = calculateBillByTariff(predictedUnits, activeState).total;
  const previousUnits = history.length > 1 ? history[history.length - 2].units : 0;
  const user = await User.findById(req.user._id);
  await evaluateAndCreateAlerts({ user, currentUnits: Number(units), previousUnits, predictedBill });

  return res.status(201).json({ usage, bill, predictedUnits, predictedBill });
};

export const getUsageHistory = async (req, res) => {
  const data = await Usage.find({ user: req.user._id }).sort({ date: 1 });
  return res.json(data);
};

export const predictUsage = async (req, res) => {
  const { pastMonthsUnits, state } = req.body;
  if (!Array.isArray(pastMonthsUnits) || pastMonthsUnits.length < 2) {
    return res.status(400).json({ message: "Provide at least 2 months of units data" });
  }

  const units = predictNextMonthUnits(pastMonthsUnits.slice(-6));
  const estimatedBill = calculateBillByTariff(units, state || req.user.state).total;
  const trainingSeries = pastMonthsUnits.slice(-6).map((value, index) => ({ monthIndex: index + 1, units: Number(value) }));

  return res.json({ predictedUnits: units, estimatedBill, trainingSeries });
};

export const getDashboardSummary = async (req, res) => {
  const history = await Usage.find({ user: req.user._id }).sort({ date: 1 });
  const last = history[history.length - 1];
  const prev = history[history.length - 2];
  const unitsSeries = history.map((h) => ({ month: h.monthLabel, units: h.units, bill: h.billAmount }));
  const dailyAvg = last ? Number((last.units / 30).toFixed(2)) : 0;
  const dailySeries = Array.from({ length: 7 }, (_, idx) => ({
    day: `D${idx + 1}`,
    units: Number((dailyAvg * (0.9 + (idx % 3) * 0.06)).toFixed(2))
  }));
  const weeklySeries = Array.from({ length: 4 }, (_, idx) => ({
    week: `W${idx + 1}`,
    units: Number(((last?.units || 0) * [0.22, 0.25, 0.24, 0.29][idx]).toFixed(2))
  }));
  const comparePercent =
    last && prev && prev.units > 0 ? Number((((last.units - prev.units) / prev.units) * 100).toFixed(2)) : 0;
  const predictionBase = history.slice(-6).map((h) => h.units);
  const predictedUnits = predictionBase.length >= 2 ? predictNextMonthUnits(predictionBase) : last?.units || 0;
  const predictedBill = calculateBillByTariff(predictedUnits, req.user.state).total;
  const green = calculateGreenEnergyScore(last?.units || 0);

  return res.json({
    totalUnits: last?.units || 0,
    totalBill: last?.billAmount || 0,
    predictedUnits,
    predictedBill,
    dailyAvg,
    dailySeries,
    weeklySeries,
    comparePercent,
    unitsSeries,
    green
  });
};
