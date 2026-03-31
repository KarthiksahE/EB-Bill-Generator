import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import AppliancePieChart from "../components/AppliancePieChart";
import api from "../services/api";

const emptyAppliance = { name: "Fan", watt: 75, hoursPerDay: 0, quantity: 1 };
const presets = {
  Fan: { watt: 75, hoursPerDay: 8, quantity: 1 },
  AC: { watt: 1500, hoursPerDay: 6, quantity: 1 },
  TV: { watt: 120, hoursPerDay: 4, quantity: 1 },
  Fridge: { watt: 180, hoursPerDay: 24, quantity: 1 },
  Light: { watt: 12, hoursPerDay: 6, quantity: 3 },
  Laptop: { watt: 65, hoursPerDay: 5, quantity: 1 }
};

export default function ApplianceTracker() {
  const [appliances, setAppliances] = useState([emptyAppliance]);
  const [metrics, setMetrics] = useState({ usageRows: [], totalUnits: 0, percentage: [] });
  const [error, setError] = useState("");

  const load = async () => {
    const { data } = await api.get("/appliances");
    if (data.appliances.length) {
      setAppliances(data.appliances);
    }
    setMetrics(data);
  };

  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    setError("");
    const invalid = appliances.some(
      (a) => !a.name || Number(a.watt) <= 0 || Number(a.hoursPerDay) < 0 || Number(a.quantity) <= 0
    );
    if (invalid) {
      setError("Please enter valid appliance name, watt, hours/day and quantity.");
      return;
    }
    const { data } = await api.put("/appliances", { appliances });
    setMetrics(data);
  };

  const setRow = (idx, key, value) => {
    const clone = [...appliances];
    clone[idx] = { ...clone[idx], [key]: value };
    setAppliances(clone);
  };

  const applyPreset = (idx, presetName) => {
    const preset = presets[presetName];
    if (!preset) {
      return;
    }
    const clone = [...appliances];
    clone[idx] = { ...clone[idx], name: presetName, ...preset };
    setAppliances(clone);
  };

  const removeRow = (idx) => {
    if (appliances.length === 1) {
      setAppliances([emptyAppliance]);
      return;
    }
    setAppliances(appliances.filter((_, i) => i !== idx));
  };

  const dailyUnits = Number(((metrics.totalUnits || 0) / 30).toFixed(2));
  const topConsumer = (metrics.percentage || []).slice().sort((a, b) => b.monthlyUnits - a.monthlyUnits)[0];

  return (
    <Layout>
      <section className="grid gap-4 sm:grid-cols-3">
        <div className="glass rounded-2xl p-4">
          <p className="text-sm text-slate-300">Monthly Units</p>
          <p className="mt-1 text-2xl text-cyanEdge">{metrics.totalUnits || 0}</p>
        </div>
        <div className="glass rounded-2xl p-4">
          <p className="text-sm text-slate-300">Daily Average</p>
          <p className="mt-1 text-2xl text-mint">{dailyUnits}</p>
        </div>
        <div className="glass rounded-2xl p-4">
          <p className="text-sm text-slate-300">Top Consumer</p>
          <p className="mt-1 text-xl text-amberSoft">{topConsumer?.name || "-"}</p>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="glass rounded-2xl p-5">
          <h2 className="font-display text-xl">Appliance-wise Tracking</h2>
          <div className="mt-4 space-y-3">
            {appliances.map((a, idx) => (
              <div key={idx} className="grid gap-2 rounded-xl border border-white/10 p-3 sm:grid-cols-6">
                <select
                  className="rounded-lg bg-white/5 p-2"
                  value={a.name}
                  onChange={(e) => {
                    setRow(idx, "name", e.target.value);
                    applyPreset(idx, e.target.value);
                  }}
                >
                  <option value="">Select</option>
                  {Object.keys(presets).map((key) => (
                    <option key={key} value={key}>{key}</option>
                  ))}
                  <option value="Custom">Custom</option>
                </select>
                <input
                  className="rounded-lg bg-white/5 p-2"
                  value={a.name}
                  onChange={(e) => setRow(idx, "name", e.target.value)}
                  placeholder="Appliance"
                />
                <input
                  className="rounded-lg bg-white/5 p-2"
                  type="number"
                  value={a.watt}
                  onChange={(e) => setRow(idx, "watt", Number(e.target.value))}
                  placeholder="Watt"
                />
                <input
                  className="rounded-lg bg-white/5 p-2"
                  type="number"
                  value={a.hoursPerDay}
                  onChange={(e) => setRow(idx, "hoursPerDay", Number(e.target.value))}
                  placeholder="Hours/day"
                />
                <input
                  className="rounded-lg bg-white/5 p-2"
                  type="number"
                  value={a.quantity}
                  onChange={(e) => setRow(idx, "quantity", Number(e.target.value))}
                  placeholder="Qty"
                />
                <button
                  type="button"
                  onClick={() => removeRow(idx)}
                  className="rounded-lg border border-rose-300/30 bg-rose-500/10 p-2 text-rose-200"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
          {error && <p className="mt-3 text-sm text-rose-300">{error}</p>}
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => setAppliances([...appliances, emptyAppliance])}
              className="rounded-xl border border-white/20 px-4 py-2"
            >
              Add Appliance
            </button>
            <button onClick={save} className="rounded-xl bg-cyanEdge px-4 py-2 font-semibold text-slate-900">
              Save & Calculate
            </button>
          </div>
        </section>

        <section className="space-y-4">
          <AppliancePieChart data={metrics.usageRows || []} />
          <div className="glass rounded-2xl p-4">
            <h3 className="font-display text-lg">Appliance Units Table</h3>
            <table className="mt-3 w-full text-sm">
              <thead>
                <tr className="text-left text-slate-400">
                  <th>Name</th>
                  <th>Units (kWh/month)</th>
                  <th>% Share</th>
                </tr>
              </thead>
              <tbody>
                {(metrics.percentage || []).map((row) => (
                  <tr key={row.name} className="border-t border-white/10">
                    <td className="py-2">{row.name}</td>
                    <td>{row.monthlyUnits}</td>
                    <td>{row.percent}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-3 text-sm text-mint">Total: {metrics.totalUnits || 0} kWh/month</p>
          </div>
        </section>
      </div>
    </Layout>
  );
}
