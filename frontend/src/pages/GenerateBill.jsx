import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function GenerateBill() {
  const { user } = useAuth();
  const [form, setForm] = useState({ units: "", monthLabel: "", state: "Tamil Nadu" });
  const [result, setResult] = useState(null);
  const [paymentMessage, setPaymentMessage] = useState("");
  const [paymentError, setPaymentError] = useState("");
  const [history, setHistory] = useState([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const loadHistory = async () => {
    const { data } = await api.get("/bills");
    setHistory(data);
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const submitUsage = async () => {
    await api.post("/usage", {
      units: Number(form.units),
      monthLabel: form.monthLabel,
      state: form.state
    });
  };

  const onGenerate = async (e) => {
    e.preventDefault();
    setPaymentMessage("");
    setPaymentError("");
    try {
      await submitUsage();
      const { data } = await api.post("/bills", {
        units: Number(form.units),
        monthLabel: form.monthLabel,
        state: form.state
      });
      setResult(data);
      await loadHistory();
      setPaymentMessage("Bill generated successfully.");
    } catch (error) {
      setPaymentError(error.response?.data?.message || "Unable to generate bill.");
    }
  };

  const markPaid = async (billId) => {
    setPaymentError("");
    const tx = window.prompt("Enter 12-digit UPI reference/UTR number after completing payment");
    const normalizedTx = String(tx || "").trim();
    if (!/^\d{12}$/.test(normalizedTx)) {
      setPaymentError("Please enter a valid 12-digit UPI reference/UTR number.");
      return;
    }
    const { data } = await api.post(`/bills/${billId}/pay`, { transactionId: normalizedTx });
    setResult((prev) => (prev ? { ...prev, bill: data.bill } : prev));
    setPaymentMessage(`Payment successful. Transaction ID: ${data.bill.transactionId}`);
    await loadHistory();
  };

  const downloadPdf = async (billId, monthLabel) => {
    setPaymentError("");
    try {
      const response = await api.get(`/bills/${billId}/pdf`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: "application/pdf" }));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `bill-${monthLabel}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setPaymentError(error.response?.data?.message || "Unable to download PDF.");
    }
  };

  const filteredHistory = history.filter((bill) => {
    const byStatus = statusFilter === "all" ? true : bill.paymentStatus === statusFilter;
    const byQuery = query
      ? bill.monthLabel.toLowerCase().includes(query.toLowerCase()) ||
        String(bill.transactionId || "").toLowerCase().includes(query.toLowerCase())
      : true;
    return byStatus && byQuery;
  });

  const pendingAmount = filteredHistory
    .filter((b) => b.paymentStatus !== "paid")
    .reduce((acc, b) => acc + Number(b.amount || 0), 0)
    .toFixed(2);

  return (
    <Layout>
      <div className="grid gap-4 xl:grid-cols-2">
        <form onSubmit={onGenerate} className="glass rounded-2xl p-5">
          <h2 className="font-display text-xl">Generate Bi-Monthly Bill Receipt</h2>
          <input
            className="mt-4 w-full rounded-xl border border-white/20 bg-white/5 p-3"
            type="number"
            placeholder="Units consumed"
            value={form.units}
            onChange={(e) => setForm({ ...form, units: e.target.value })}
          />
          <input
            className="mt-3 w-full rounded-xl border border-white/20 bg-white/5 p-3"
            placeholder="Billing cycle label (e.g., Jan-Feb 2026)"
            value={form.monthLabel}
            onChange={(e) => setForm({ ...form, monthLabel: e.target.value })}
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
          <button className="mt-4 rounded-xl bg-cyanEdge px-4 py-3 font-semibold text-slate-900">Generate</button>
        </form>

        <section className="glass rounded-2xl p-5">
          <h2 className="font-display text-xl">Receipt Preview</h2>
          <p className="mt-1 text-xs text-slate-400">Consumer No: {user?.consumerNumber || "-"}</p>
          {!result ? (
            <p className="mt-6 text-sm text-slate-400">Generate a bill to view QR and complete payment.</p>
          ) : (
            <div className="mt-4 space-y-2">
              <p>Units: {result.details.units}</p>
              <p>Total Amount: Rs {result.details.total}</p>
              <p>Status: <span className={result.bill.paymentStatus === "paid" ? "text-emerald-300" : "text-amber-300"}>{result.bill.paymentStatus}</span></p>
              <img className="mt-3 h-44 w-44 rounded-lg bg-white p-2" src={result.details.qrDataUrl} alt="UPI QR" />
              {result.bill.paymentStatus !== "paid" ? (
                <button
                  onClick={() => markPaid(result.bill._id)}
                  className="mt-3 inline-block rounded-xl bg-cyanEdge px-4 py-2 font-semibold text-slate-900"
                >
                  Complete Payment
                </button>
              ) : (
                <button
                  className="mt-3 inline-block rounded-xl bg-mint px-4 py-2 font-semibold text-slate-900"
                  onClick={() => downloadPdf(result.bill._id, result.bill.monthLabel)}
                >
                  Download PDF
                </button>
              )}
              {paymentMessage && <p className="text-sm text-emerald-300">{paymentMessage}</p>}
              {paymentError && <p className="text-sm text-rose-300">{paymentError}</p>}
            </div>
          )}
        </section>
      </div>

      <section className="glass mt-4 rounded-2xl p-5">
        <h2 className="font-display text-xl">Bill History</h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          <input
            className="rounded-xl border border-white/20 bg-white/5 p-2"
            placeholder="Search by month or transaction"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <select
            className="rounded-xl border border-white/20 bg-white/5 p-2"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
          </select>
          <div className="rounded-xl border border-white/10 bg-white/5 p-2 text-sm text-slate-200">
            Pending Amount: Rs {pendingAmount}
          </div>
        </div>

        {filteredHistory.length === 0 ? (
          <p className="mt-3 text-sm text-slate-400">No bills yet.</p>
        ) : (
          <div className="mt-3 overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-400">
                  <th className="py-2">Month</th>
                  <th>Units</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Transaction</th>
                  <th>QR</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.map((bill) => (
                  <tr key={bill._id} className="border-t border-white/10">
                    <td className="py-2">{bill.monthLabel}</td>
                    <td>{bill.units}</td>
                    <td>Rs {bill.amount}</td>
                    <td className={bill.paymentStatus === "paid" ? "text-emerald-300" : "text-amber-300"}>{bill.paymentStatus}</td>
                    <td className="text-xs text-slate-300">{bill.transactionId || "-"}</td>
                    <td>
                      {bill.qrDataUrl ? (
                        <img
                          src={bill.qrDataUrl}
                          alt={`QR for ${bill.monthLabel}`}
                          className="h-14 w-14 rounded bg-white p-1"
                        />
                      ) : (
                        <span className="text-xs text-slate-400">N/A</span>
                      )}
                    </td>
                    <td>
                      {bill.paymentStatus === "paid" ? (
                        <button
                          className="rounded-lg bg-mint px-3 py-1 text-slate-900"
                          onClick={() => downloadPdf(bill._id, bill.monthLabel)}
                        >
                          Download PDF
                        </button>
                      ) : (
                        <button
                          onClick={() => markPaid(bill._id)}
                          className="rounded-lg bg-cyanEdge px-3 py-1 text-slate-900"
                        >
                          Pay Now
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </Layout>
  );
}
