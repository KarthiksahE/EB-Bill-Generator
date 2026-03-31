export const trainLinearRegression = (values) => {
  const y = values.map(Number);
  const n = y.length;
  const x = Array.from({ length: n }, (_, idx) => idx + 1);

  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((acc, xi, i) => acc + xi * y[i], 0);
  const sumXX = x.reduce((acc, xi) => acc + xi * xi, 0);

  const denominator = n * sumXX - sumX * sumX;
  const slope = denominator === 0 ? 0 : (n * sumXY - sumX * sumY) / denominator;
  const intercept = (sumY - slope * sumX) / n;

  return {
    slope,
    intercept,
    predict: (inputX) => slope * inputX + intercept
  };
};

export const predictNextMonthUnits = (pastMonths) => {
  const model = trainLinearRegression(pastMonths);
  const nextX = pastMonths.length + 1;
  const prediction = model.predict(nextX);
  return Math.max(0, Number(prediction.toFixed(2)));
};
