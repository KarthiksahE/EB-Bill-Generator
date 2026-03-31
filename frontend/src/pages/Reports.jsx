import { useMemo, useRef, useState } from "react";
import Layout from "../components/Layout";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import api from "../services/api";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export default function Reports() {
  const [past, setPast] = useState([210, 225, 240, 255, 275, 290]);
  const [result, setResult] = useState(null);
  const [note, setNote] = useState("");
  const [usageHistory, setUsageHistory] = useState([]);
  const [billHistory, setBillHistory] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const chartRef = useRef(null);

  const loadFromHistory = async () => {
    const [{ data }, { data: bills }] = await Promise.all([api.get("/usage"), api.get("/bills")]);
    setUsageHistory(data);
    setBillHistory(bills);
    const lastSix = data.slice(-6).map((x) => Number(x.units));
    if (lastSix.length >= 2) {
      setPast(lastSix);
      setNote("Loaded recent usage data from your account history.");
    } else {
      setNote("Not enough usage history found. Enter values manually.");
    }
  };

  const runPrediction = async () => {
    const { data } = await api.post("/usage/predict", { pastMonthsUnits: past });
    setResult(data);
  };

  const points = result
    ? [
        ...result.trainingSeries.map((x) => ({ month: `M${x.monthIndex}`, units: x.units })),
        { month: "Next", units: result.predictedUnits }
      ]
    : [];

  const avg = past.length ? Number((past.reduce((a, b) => a + b, 0) / past.length).toFixed(2)) : 0;
  const growth = result ? Number((((result.predictedUnits - past[past.length - 1]) / (past[past.length - 1] || 1)) * 100).toFixed(2)) : 0;

  const monthlyRows = useMemo(() => {
    const key = selectedMonth;
    const rows = usageHistory
      .filter((u) => {
        const d = new Date(u.date || u.createdAt);
        const mk = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        return mk === key;
      })
      .map((u) => ({
        date: new Date(u.date || u.createdAt).toLocaleDateString("en-IN"),
        units: u.units,
        bill: u.billAmount
      }));

    if (rows.length === 0 && billHistory.length) {
      return billHistory
        .filter((b) => {
          const d = new Date(b.createdAt);
          const mk = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
          return mk === key;
        })
        .map((b) => ({ date: b.monthLabel, units: b.units, bill: b.amount }));
    }

    return rows;
  }, [usageHistory, billHistory, selectedMonth]);

  const downloadCsv = () => {
    const headers = ["Date/Month", "Units", "Bill"];
    const lines = monthlyRows.map((r) => [r.date, r.units, r.bill].join(","));
    const csv = [headers.join(","), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `monthly-report-${selectedMonth}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const downloadPdf = async () => {
    if (!chartRef.current) {
      return;
    }
    const canvas = await html2canvas(chartRef.current, { backgroundColor: "#0b1220", scale: 2 });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
    pdf.setTextColor(20, 20, 20);
    pdf.text(`Smart EB Monthly Report (${selectedMonth})`, 40, 40);
    pdf.addImage(imgData, "PNG", 40, 60, 515, 300);
    pdf.save(`monthly-report-${selectedMonth}.pdf`);
  };

  return (
    <Layout>
      <section className="grid gap-4 sm:grid-cols-3">
        <div className="glass rounded-2xl p-4">
          <p className="text-sm text-slate-300">6-Month Average</p>
          <p className="mt-1 text-2xl text-cyanEdge">{avg}</p>
        </div>
        <div className="glass rounded-2xl p-4">
          <p className="text-sm text-slate-300">Forecast Growth</p>
          <p className={`mt-1 text-2xl ${growth >= 0 ? "text-amberSoft" : "text-mint"}`}>{growth}%</p>
        </div>
        <div className="glass rounded-2xl p-4">
          <p className="text-sm text-slate-300">Predicted Bill</p>
          <p className="mt-1 text-2xl text-mint">Rs {result?.estimatedBill || "-"}</p>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="glass rounded-2xl p-5">
          <h2 className="font-display text-xl">AI Usage Prediction</h2>
          <p className="mt-2 text-sm text-slate-400">Enter past 6 months units for linear regression model.</p>
          <div className="mt-3 flex gap-2">
            <button onClick={loadFromHistory} className="rounded-xl border border-white/20 px-3 py-2 text-sm">
              Autofill From History
            </button>
          </div>
          {note && <p className="mt-2 text-xs text-slate-300">{note}</p>}
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {past.map((value, idx) => (
              <input
                key={idx}
                className="rounded-lg bg-white/5 p-2"
                type="number"
                value={value}
                onChange={(e) => {
                  const clone = [...past];
                  clone[idx] = Number(e.target.value);
                  setPast(clone);
                }}
              />
            ))}
          </div>
          <button onClick={runPrediction} className="mt-4 rounded-xl bg-cyanEdge px-4 py-2 font-semibold text-slate-900">
            Predict Next Month
          </button>

          {result && (
            <div className="mt-5 space-y-2 text-sm">
              <p>Predicted Units: <span className="text-cyanEdge">{result.predictedUnits}</span></p>
              <p>Estimated Bill: <span className="text-mint">Rs {result.estimatedBill}</span></p>
              <p>
                Insight:
                <span className="ml-1 text-slate-200">
                  {growth > 10
                    ? "Usage trend is rising quickly. Consider reducing AC/fan hours."
                    : growth > 0
                      ? "Moderate upward trend detected."
                      : "Usage trend is stable or improving."}
                </span>
              </p>
            </div>
          )}
        </section>

        <section className="glass rounded-2xl p-5">
          <h2 className="font-display text-xl">Prediction Trend Graph</h2>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={points}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f334b" />
                <XAxis dataKey="month" stroke="#9bb9d1" />
                <YAxis stroke="#9bb9d1" />
                <Tooltip />
                <Line dataKey="units" stroke="#31d7ff" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <section className="glass mt-4 rounded-2xl p-5">
        <h2 className="font-display text-xl">Export Center</h2>
        <p className="mt-1 text-sm text-slate-400">Download monthly reports in CSV/PDF with charts.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <input
            type="month"
            className="rounded-xl border border-white/20 bg-white/5 p-2"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          />
          <button onClick={loadFromHistory} className="rounded-xl border border-white/20 px-3 py-2 text-sm">
            Refresh Data
          </button>
          <button onClick={downloadCsv} className="rounded-xl bg-cyanEdge px-3 py-2 text-sm font-semibold text-slate-900">
            Download CSV
          </button>
          <button onClick={downloadPdf} className="rounded-xl bg-mint px-3 py-2 text-sm font-semibold text-slate-900">
            Download PDF (with chart)
          </button>
        </div>

        <div ref={chartRef} className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <h3 className="font-display text-lg">Monthly Units Chart</h3>
            <div className="mt-3 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyRows}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f334b" />
                  <XAxis dataKey="date" stroke="#9bb9d1" />
                  <YAxis stroke="#9bb9d1" />
                  <Tooltip />
                  <Line dataKey="units" stroke="#31d7ff" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <h3 className="font-display text-lg">Monthly Bill Chart</h3>
            <div className="mt-3 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyRows}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f334b" />
                  <XAxis dataKey="date" stroke="#9bb9d1" />
                  <YAxis stroke="#9bb9d1" />
                  <Tooltip />
                  <Bar dataKey="bill" fill="#7fffd4" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
