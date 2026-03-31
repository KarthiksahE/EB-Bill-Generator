export default function SummaryCard({ title, value, subtitle, accent = "text-cyanEdge" }) {
  return (
    <div className="glass animate-floatIn rounded-2xl p-4">
      <p className="text-sm text-slate-300">{title}</p>
      <h3 className={`mt-2 text-2xl font-semibold ${accent}`}>{value}</h3>
      <p className="mt-1 text-xs text-slate-400">{subtitle}</p>
    </div>
  );
}
