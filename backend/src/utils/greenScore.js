export const calculateGreenEnergyScore = (units, householdAverage = 250) => {
  const ratio = (units - householdAverage) / householdAverage;
  const rawScore = 100 - ratio * 100;
  const score = Math.max(0, Math.min(100, Math.round(rawScore)));

  let grade = "Needs Improvement";
  if (score >= 80) {
    grade = "Good";
  } else if (score >= 50) {
    grade = "Average";
  }

  const tips = [
    "Use LED bulbs and turn off standby devices.",
    "Keep AC at 24C to reduce compressor load.",
    "Run high-power appliances during off-peak time.",
    "Track fan and AC hours weekly in Appliance Tracker."
  ];

  return { score, grade, householdAverage, tips };
};
