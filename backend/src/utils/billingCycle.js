const MIN_BILLING_CYCLE_DAYS = 55;

export const ensureBiMonthlyBillingWindow = ({ lastBillDate, nowDate = new Date() }) => {
  if (!lastBillDate) {
    return { ok: true };
  }

  const last = new Date(lastBillDate);
  const now = new Date(nowDate);
  const diffMs = now.getTime() - last.getTime();
  const elapsedDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (elapsedDays >= MIN_BILLING_CYCLE_DAYS) {
    return { ok: true };
  }

  const remainingDays = MIN_BILLING_CYCLE_DAYS - elapsedDays;
  const nextEligibleDate = new Date(last.getTime() + MIN_BILLING_CYCLE_DAYS * 24 * 60 * 60 * 1000);

  return {
    ok: false,
    remainingDays,
    nextEligibleDate
  };
};
