import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

const colors = ["#31d7ff", "#7fffd4", "#ffc66b", "#ff8b8b", "#9ca3ff", "#50fa7b"];

export default function AppliancePieChart({ data }) {
  return (
    <div className="glass rounded-2xl p-4">
      <h3 className="font-display text-lg">Appliance Usage Share</h3>
      <div className="mt-4 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="monthlyUnits" nameKey="name" outerRadius={90} label>
              {data.map((entry, idx) => (
                <Cell key={entry.name} fill={colors[idx % colors.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
