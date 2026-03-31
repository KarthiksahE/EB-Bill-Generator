import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Signup() {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    city: "",
    address: "",
    pincode: "",
    state: "Tamil Nadu"
  });
  const [error, setError] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await signup(form);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Signup failed");
    }
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-md items-center p-4">
      <form onSubmit={onSubmit} className="glass w-full rounded-2xl p-6">
        <h1 className="font-display text-2xl">Create Account</h1>
        <input
          className="mt-4 w-full rounded-xl border border-white/20 bg-white/5 p-3"
          placeholder="Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <input
          className="mt-3 w-full rounded-xl border border-white/20 bg-white/5 p-3"
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
        <input
          className="mt-3 w-full rounded-xl border border-white/20 bg-white/5 p-3"
          placeholder="City"
          value={form.city}
          onChange={(e) => setForm({ ...form, city: e.target.value })}
        />
        <input
          className="mt-3 w-full rounded-xl border border-white/20 bg-white/5 p-3"
          placeholder="Address"
          value={form.address}
          onChange={(e) => setForm({ ...form, address: e.target.value })}
        />
        <input
          className="mt-3 w-full rounded-xl border border-white/20 bg-white/5 p-3"
          placeholder="Pincode"
          maxLength={6}
          value={form.pincode}
          onChange={(e) => setForm({ ...form, pincode: e.target.value.replace(/\D/g, "") })}
        />
        <select
          className="mt-3 w-full rounded-xl border border-white/20 bg-white/5 p-3"
          value={form.state}
          onChange={(e) => setForm({ ...form, state: e.target.value })}
        >
          <option>Tamil Nadu</option>
          <option>Karnataka</option>
          <option>Maharashtra</option>
        </select>
        {error && <p className="mt-3 text-sm text-rose-300">{error}</p>}
        <button className="mt-4 w-full rounded-xl bg-mint px-4 py-3 font-semibold text-slate-900">Signup</button>
        <p className="mt-4 text-sm text-slate-300">
          Already registered? <Link to="/login" className="text-cyanEdge">Login</Link>
        </p>
      </form>
    </div>
  );
}
