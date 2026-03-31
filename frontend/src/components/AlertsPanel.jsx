const colorMap = {
  info: "border-emerald-300/30 bg-emerald-400/10 text-emerald-100",
  warning: "border-amber-300/40 bg-amber-400/10 text-amber-100",
  critical: "border-rose-300/40 bg-rose-400/10 text-rose-100"
};

export default function AlertsPanel({ alerts }) {
  return (
    <section className="glass rounded-2xl p-4">
      <h3 className="font-display text-lg">Smart Alerts</h3>
      <div className="mt-4 space-y-3">
        {alerts.length === 0 ? (
          <p className="text-sm text-slate-400">No alerts yet.</p>
        ) : (
          alerts.map((alert) => (
            <div key={alert._id} className={`rounded-xl border p-3 ${colorMap[alert.severity] || colorMap.info}`}>
              <p className="text-xs uppercase tracking-wide opacity-80">{alert.type.replaceAll("_", " ")}</p>
              <p className="text-sm">{alert.message}</p>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
