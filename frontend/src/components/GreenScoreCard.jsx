export default function GreenScoreCard({ green }) {
  const score = green?.score || 0;
  const ringColor = score >= 80 ? "text-emerald-300" : score >= 50 ? "text-amberSoft" : "text-rose-300";
  return (
    <section className="glass rounded-2xl p-4">
      <h3 className="font-display text-lg">Green Energy Score</h3>
      <div className="mt-4 flex items-center gap-4">
        <div className={`text-5xl font-bold ${ringColor}`}>{score}</div>
        <div>
          <p className="text-sm text-slate-200">Grade: {green?.grade || "-"}</p>
          <p className="text-xs text-slate-400">Compared against avg {green?.householdAverage || 250} units/month</p>
        </div>
      </div>
      <ul className="mt-4 space-y-1 text-xs text-slate-300">
        {(green?.tips || []).slice(0, 3).map((tip) => (
          <li key={tip}>• {tip}</li>
        ))}
      </ul>
    </section>
  );
}
