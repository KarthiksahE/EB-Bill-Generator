import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import SummaryCard from "../components/SummaryCard";
import UsageCharts from "../components/UsageCharts";
import AlertsPanel from "../components/AlertsPanel";
import GreenScoreCard from "../components/GreenScoreCard";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
  const { user } = useAuth();
  const [summary, setSummary] = useState({ unitsSeries: [], green: {} });
  const [alerts, setAlerts] = useState([]);
  const now = new Date();
  const dateText = now.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  });

  useEffect(() => {
    const load = async () => {
      const [{ data: dashboard }, { data: alertsData }] = await Promise.all([
        api.get("/usage/dashboard"),
        api.get("/alerts")
      ]);
      setSummary(dashboard);
      setAlerts(alertsData);
    };
    load();
  }, []);

  return (
    <Layout>
      <section className="glass rounded-2xl p-4">
        <p className="text-sm text-slate-300">Customer</p>
        <p className="mt-1 font-display text-xl text-slate-100">{user?.name || "-"}</p>
        <p className="mt-2 text-sm text-slate-300">Location</p>
        <p className="text-lg text-mint">{user?.city || "-"}, {user?.state || "-"}</p>
        <p className="text-sm text-slate-300">Consumer Number</p>
        <p className="mt-1 font-display text-xl text-cyanEdge">{user?.consumerNumber || "Will be generated on login"}</p>
        <p className="mt-2 text-sm text-slate-300">Current Date</p>
        <p className="text-lg text-mint">{dateText}</p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard title="Total Units" value={summary.totalUnits || 0} subtitle="Current month" />
        <SummaryCard
          title="Total Bill"
          value={`Rs ${summary.totalBill || 0}`}
          subtitle="Current month amount"
          accent="text-mint"
        />
        <SummaryCard title="Predicted Units" value={summary.predictedUnits || 0} subtitle="Next month forecast" />
        <SummaryCard
          title="Daily Average"
          value={summary.dailyAvg || 0}
          subtitle={`${summary.comparePercent || 0}% vs previous month`}
          accent="text-amberSoft"
        />
      </section>

      <UsageCharts
        data={{
          monthly: summary.unitsSeries || [],
          weekly: summary.weeklySeries || [],
          daily: summary.dailySeries || []
        }}
      />

      <section className="grid gap-4 lg:grid-cols-2">
        <AlertsPanel alerts={alerts} />
        <GreenScoreCard green={summary.green} />
      </section>
    </Layout>
  );
}
