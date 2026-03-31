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

export default function UsageCharts({ data }) {
  const monthly = data?.monthly || [];
  const weekly = data?.weekly || [];
  const daily = data?.daily || [];

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="glass rounded-2xl p-4">
        <h3 className="font-display text-lg">Monthly Usage Trend</h3>
        <div className="mt-4 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f334b" />
              <XAxis dataKey="month" stroke="#9bb9d1" />
              <YAxis stroke="#9bb9d1" />
              <Tooltip />
              <Line dataKey="units" stroke="#31d7ff" strokeWidth={3} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="glass rounded-2xl p-4">
        <h3 className="font-display text-lg">Weekly Consumption</h3>
        <div className="mt-4 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weekly}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f334b" />
              <XAxis dataKey="week" stroke="#9bb9d1" />
              <YAxis stroke="#9bb9d1" />
              <Tooltip />
              <Bar dataKey="units" fill="#7fffd4" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="glass rounded-2xl p-4">
        <h3 className="font-display text-lg">Daily Average Pattern</h3>
        <div className="mt-4 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={daily}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f334b" />
              <XAxis dataKey="day" stroke="#9bb9d1" />
              <YAxis stroke="#9bb9d1" />
              <Tooltip />
              <Line dataKey="units" stroke="#ffc66b" strokeWidth={3} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
