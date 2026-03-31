const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec"
];

const MONTH_TOKEN_TO_INDEX = {
  jan: 0,
  january: 0,
  feb: 1,
  february: 1,
  mar: 2,
  march: 2,
  apr: 3,
  april: 3,
  may: 4,
  jun: 5,
  june: 5,
  jul: 6,
  july: 6,
  aug: 7,
  august: 7,
  sep: 8,
  september: 8,
  oct: 9,
  october: 9,
  nov: 10,
  november: 10,
  dec: 11,
  december: 11
};

const getPairStartIndex = (monthIndex) => Math.floor(monthIndex / 2) * 2;

export const formatBiMonthlyCycleLabel = (date = new Date()) => {
  const year = date.getFullYear();
  const pairStart = getPairStartIndex(date.getMonth());
  return `${MONTHS[pairStart]}-${MONTHS[pairStart + 1]} ${year}`;
};

export const normalizeBiMonthlyCycleLabel = (label) => {
  if (!label || typeof label !== "string") {
    return null;
  }

  const trimmed = label.trim().replace(/\s+/g, " ");
  const match = /^([A-Za-z]+)-([A-Za-z]+)\s+(\d{4})$/.exec(trimmed);
  if (!match) {
    return null;
  }

  const startToken = match[1].toLowerCase();
  const endToken = match[2].toLowerCase();
  const year = Number(match[3]);

  const startIndex = MONTH_TOKEN_TO_INDEX[startToken];
  const endIndex = MONTH_TOKEN_TO_INDEX[endToken];

  if (startIndex === undefined || endIndex === undefined || !Number.isFinite(year)) {
    return null;
  }

  const expectedStart = getPairStartIndex(startIndex);
  const expectedEnd = expectedStart + 1;

  if (startIndex !== expectedStart || endIndex !== expectedEnd) {
    return null;
  }

  return `${MONTHS[startIndex]}-${MONTHS[endIndex]} ${year}`;
};

export const getNextBiMonthlyCycleLabel = (label) => {
  const normalized = normalizeBiMonthlyCycleLabel(label);
  if (!normalized) {
    return formatBiMonthlyCycleLabel();
  }

  const match = /^([A-Za-z]{3})-([A-Za-z]{3})\s+(\d{4})$/.exec(normalized);
  if (!match) {
    return formatBiMonthlyCycleLabel();
  }

  const startIndex = MONTH_TOKEN_TO_INDEX[match[1].toLowerCase()];
  let year = Number(match[3]);
  const nextStartIndex = (startIndex + 2) % 12;

  if (startIndex >= 10) {
    year += 1;
  }

  return `${MONTHS[nextStartIndex]}-${MONTHS[nextStartIndex + 1]} ${year}`;
};

export const getBiMonthlyCycleSerial = (label) => {
  const normalized = normalizeBiMonthlyCycleLabel(label);
  if (!normalized) {
    return null;
  }

  const match = /^([A-Za-z]{3})-([A-Za-z]{3})\s+(\d{4})$/.exec(normalized);
  if (!match) {
    return null;
  }

  const startIndex = MONTH_TOKEN_TO_INDEX[match[1].toLowerCase()];
  const year = Number(match[3]);
  if (startIndex === undefined || !Number.isFinite(year)) {
    return null;
  }

  const cycleIndex = Math.floor(startIndex / 2); // 0..5 per year
  return year * 6 + cycleIndex;
};
