import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await login(form);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-md items-center p-4">
      <form onSubmit={onSubmit} className="glass w-full rounded-2xl p-6">
        <h1 className="font-display text-2xl">Welcome Back</h1>
        <p className="mt-1 text-sm text-slate-400">Smart Electricity Billing System</p>
        <input
          className="mt-4 w-full rounded-xl border border-white/20 bg-white/5 p-3"
          placeholder="Email"
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <input
          className="mt-3 w-full rounded-xl border border-white/20 bg-white/5 p-3"
          placeholder="Password"
          type="password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        {error && <p className="mt-3 text-sm text-rose-300">{error}</p>}
        <button className="mt-4 w-full rounded-xl bg-cyanEdge px-4 py-3 font-semibold text-slate-900">Login</button>
        <p className="mt-4 text-sm text-slate-300">
          New user? <Link to="/signup" className="text-cyanEdge">Create account</Link>
        </p>
      </form>
    </div>
  );
}
