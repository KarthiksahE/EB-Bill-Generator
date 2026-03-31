import { useMemo, useState } from "react";
import Layout from "../components/Layout";
import { useAuth } from "../context/AuthContext";

export default function EditProfile() {
  const { user, updateProfile } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || "",
    city: user?.city || "",
    address: user?.address || "",
    pincode: user?.pincode || "",
    state: user?.state || "Tamil Nadu"
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const canSubmit = useMemo(() => {
    return (
      form.name.trim() &&
      form.city.trim() &&
      form.address.trim() &&
      /^\d{6}$/.test(form.pincode.trim())
    );
  }, [form]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!canSubmit) {
      setError("Please fill all fields correctly. Pincode must be 6 digits.");
      return;
    }

    try {
      setSaving(true);
      await updateProfile({
        name: form.name,
        city: form.city,
        address: form.address,
        pincode: form.pincode,
        state: form.state
      });
      setMessage("Profile updated successfully.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      <section className="glass mx-auto max-w-2xl rounded-2xl p-6">
        <h1 className="font-display text-2xl text-slate-100">Edit Profile</h1>
        <p className="mt-1 text-sm text-slate-300">Update your personal and address details.</p>

        <form onSubmit={onSubmit} className="mt-5 space-y-3">
          <input
            className="w-full rounded-xl border border-white/20 bg-white/5 p-3"
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />

          <input
            className="w-full rounded-xl border border-white/20 bg-white/5 p-3"
            placeholder="City"
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
          />

          <input
            className="w-full rounded-xl border border-white/20 bg-white/5 p-3"
            placeholder="Address"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />

          <input
            className="w-full rounded-xl border border-white/20 bg-white/5 p-3"
            placeholder="Pincode"
            maxLength={6}
            value={form.pincode}
            onChange={(e) => setForm({ ...form, pincode: e.target.value.replace(/\D/g, "") })}
          />

          <select
            className="w-full rounded-xl border border-white/20 bg-white/5 p-3"
            value={form.state}
            onChange={(e) => setForm({ ...form, state: e.target.value })}
          >
            <option>Tamil Nadu</option>
            <option>Karnataka</option>
            <option>Maharashtra</option>
          </select>

          {message && <p className="text-sm text-emerald-300">{message}</p>}
          {error && <p className="text-sm text-rose-300">{error}</p>}

          <button
            disabled={!canSubmit || saving}
            className="w-full rounded-xl bg-cyanEdge px-4 py-3 font-semibold text-slate-900 disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save Profile"}
          </button>
        </form>
      </section>
    </Layout>
  );
}
