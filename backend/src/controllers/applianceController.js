import ApplianceProfile from "../models/ApplianceProfile.js";

const defaultWattByName = {
  Fan: 75,
  AC: 1500,
  TV: 120,
  Fridge: 180,
  WashingMachine: 500,
  Light: 12,
  Laptop: 65
};

const toMonthlyUnits = (watt, hoursPerDay, quantity = 1) => (watt * hoursPerDay * 30 * quantity) / 1000;

export const upsertAppliances = async (req, res) => {
  const { appliances } = req.body;
  const normalized = (appliances || []).map((a) => ({
    name: a.name,
    watt: Number(a.watt || defaultWattByName[a.name] || 100),
    hoursPerDay: Number(a.hoursPerDay || 0),
    quantity: Number(a.quantity || 1)
  }));

  const profile = await ApplianceProfile.findOneAndUpdate(
    { user: req.user._id },
    { user: req.user._id, appliances: normalized },
    { upsert: true, new: true }
  );

  const usageRows = profile.appliances.map((a) => {
    const monthlyUnits = Number(toMonthlyUnits(a.watt, a.hoursPerDay, a.quantity).toFixed(2));
    return { ...a.toObject(), monthlyUnits };
  });
  const totalUnits = Number(usageRows.reduce((acc, r) => acc + r.monthlyUnits, 0).toFixed(2));

  const percentage = usageRows.map((r) => ({
    name: r.name,
    monthlyUnits: r.monthlyUnits,
    percent: totalUnits ? Number(((r.monthlyUnits / totalUnits) * 100).toFixed(2)) : 0
  }));

  return res.json({ profile, usageRows, totalUnits, percentage });
};

export const getAppliances = async (req, res) => {
  const profile = await ApplianceProfile.findOne({ user: req.user._id });
  if (!profile) {
    return res.json({ appliances: [], usageRows: [], totalUnits: 0, percentage: [] });
  }

  const usageRows = profile.appliances.map((a) => {
    const monthlyUnits = Number(toMonthlyUnits(a.watt, a.hoursPerDay, a.quantity).toFixed(2));
    return { ...a.toObject(), monthlyUnits };
  });
  const totalUnits = Number(usageRows.reduce((acc, r) => acc + r.monthlyUnits, 0).toFixed(2));
  const percentage = usageRows.map((r) => ({
    name: r.name,
    monthlyUnits: r.monthlyUnits,
    percent: totalUnits ? Number(((r.monthlyUnits / totalUnits) * 100).toFixed(2)) : 0
  }));

  return res.json({ appliances: profile.appliances, usageRows, totalUnits, percentage });
};
