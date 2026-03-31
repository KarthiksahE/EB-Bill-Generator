import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const items = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/edit-profile", label: "Edit Profile" },
  { to: "/meter-reading", label: "Meter Reading" },
  { to: "/generate-bill", label: "Generate Bill" },
  { to: "/appliances", label: "Appliance Tracker" },
  { to: "/reports", label: "Reports" }
];

export default function Sidebar() {
  const { pathname } = useLocation();
  const { logout } = useAuth();

  return (
    <aside className="glass w-full rounded-2xl p-4 md:w-64">
      <h1 className="font-display text-xl font-bold text-cyanEdge">Smart EB</h1>
      <p className="mt-1 text-xs text-slate-300">Electricity Intelligence Suite</p>
      <nav className="mt-6 space-y-2">
        {items.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className={`block rounded-xl px-3 py-2 transition ${
              pathname === item.to ? "bg-cyanEdge/20 text-cyanEdge" : "hover:bg-white/10"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <button
        onClick={logout}
        className="mt-8 w-full rounded-xl border border-rose-300/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200 hover:bg-rose-500/20"
      >
        Logout
      </button>
    </aside>
  );
}
