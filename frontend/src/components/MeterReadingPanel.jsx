import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

const MeterReading = () => {
  const { user } = useAuth();
  const [readingValue, setReadingValue] = useState("");
  const [monthLabel, setMonthLabel] = useState("");
  const [remarks, setRemarks] = useState("");
  const [meterStatus, setMeterStatus] = useState("normal");
  const [state, setState] = useState(user?.state || "Tamil Nadu");
  const [readings, setReadings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [latestReading, setLatestReading] = useState(null);
  const [cycleInfo, setCycleInfo] = useState(null);

  // Fetch all meter readings on component mount
  useEffect(() => {
    fetchReadings();
    fetchCycleInfo();
  }, []);

  const fetchCycleInfo = async () => {
    try {
      const response = await api.get("/meter/cycle-info");
      setCycleInfo(response.data);
      if (!monthLabel && response.data?.suggestedCycle) {
        setMonthLabel(response.data.suggestedCycle);
      }
    } catch (err) {
      console.error("Error fetching cycle info:", err);
    }
  };

  const fetchReadings = async () => {
    try {
      setLoading(true);
      const response = await api.get("/meter/all");
      setReadings(response.data.readings || []);

      // Get latest reading
      if (response.data.readings && response.data.readings.length > 0) {
        setLatestReading(response.data.readings[0]);
      }
    } catch (err) {
      console.error("Error fetching readings:", err);
      setError("Failed to fetch meter readings");
    } finally {
      setLoading(false);
    }
  };

  const liveUnitsPreview = latestReading
    ? Math.max(0, Number(readingValue || 0) - Number(latestReading.readingValue || 0))
    : Number(readingValue || 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!readingValue || readingValue < 0) {
      setError("Please enter a valid meter reading");
      return;
    }

    if (!monthLabel) {
      setError("Please select or enter a month label");
      return;
    }

    try {
      setLoading(true);
      const response = await api.post("/meter/record", {
        readingValue: Number(readingValue),
        monthLabel,
        state,
        remarks,
        meterStatus
      });

      setSuccess(`Meter reading recorded successfully! Units consumed: ${response.data.calculation.unitsConsumed} kWh`);
      setReadingValue("");
      setMonthLabel("");
      setRemarks("");
      setMeterStatus("normal");
      setShowForm(false);

      // Refresh readings
      await fetchReadings();
      await fetchCycleInfo();
    } catch (err) {
      setError(err.response?.data?.message || "Error recording meter reading");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateBill = async (reading) => {
    try {
      setLoading(true);
      const response = await api.post("/meter/bill/generate", {
        monthLabel: reading.monthLabel
      });

      setSuccess(`Bill generated successfully for ${reading.monthLabel}!`);
      setTimeout(() => {
        window.location.href = "/generate-bill";
      }, 1200);
    } catch (err) {
      setError(err.response?.data?.message || "Error generating bill");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 text-slate-100">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-slate-100">Meter Readings</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
        >
          {showForm ? "Cancel" : "Record New Reading"}
        </button>
      </div>

      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
        <p className="font-semibold">How to use meter reading:</p>
        <ol className="mt-2 list-decimal pl-5 space-y-1">
          <li>Click "Record New Reading".</li>
          <li>Enter current meter value exactly as shown on your meter.</li>
          <li>Use the suggested bi-monthly cycle label (example: Jan-Feb 2026).</li>
          <li>Click "Record Reading" to save. Units are auto-calculated.</li>
          <li>From the table, click "Generate Bill" for that cycle when ready.</li>
        </ol>
      </div>

      {/* Error and Success Messages */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          {success}
        </div>
      )}

      {/* Latest Reading Card */}
      {latestReading && (
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-lg shadow-lg">
          <h2 className="text-lg font-semibold mb-4">Latest Meter Reading</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-blue-100">Current Reading</p>
              <p className="text-3xl font-bold">{latestReading.readingValue} kWh</p>
            </div>
            <div>
              <p className="text-blue-100">Units Consumed</p>
              <p className="text-3xl font-bold">{latestReading.unitsConsumed} kWh</p>
            </div>
            <div>
              <p className="text-blue-100">Month</p>
              <p className="text-lg font-semibold">{latestReading.monthLabel}</p>
            </div>
            <div>
              <p className="text-blue-100">Status</p>
              <p className="text-lg font-semibold capitalize">{latestReading.meterStatus}</p>
            </div>
          </div>
          <p className="text-blue-100 text-sm mt-4">Recorded: {new Date(latestReading.date).toLocaleDateString()}</p>
        </div>
      )}

      {/* Form to Record New Reading */}
      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Record Bi-Monthly Meter Reading</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Reading Value */}
            <div>
              <label className="mb-2 flex items-center gap-2 text-gray-700 font-medium">
                Current Meter Reading (kWh) *
                <span
                  title="Enter the exact number currently shown on your physical electricity meter."
                  className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700 cursor-help"
                >
                  ?
                </span>
              </label>
              <input
                type="number"
                value={readingValue}
                onChange={(e) => setReadingValue(e.target.value)}
                placeholder="e.g., 12345"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              {latestReading && (
                <p className="text-gray-600 text-sm mt-1">
                  Previous reading: {latestReading.readingValue} kWh
                </p>
              )}
              <p className="text-blue-700 text-sm mt-1 font-medium">
                Live estimate: {liveUnitsPreview} kWh for this cycle
              </p>
            </div>

            {/* Billing Cycle Label */}
            <div>
              <label className="mb-2 flex items-center gap-2 text-gray-700 font-medium">
                Billing Cycle Label *
                <span
                  title="Use 2-month format like Jan-Feb 2026, Mar-Apr 2026, etc."
                  className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700 cursor-help"
                >
                  ?
                </span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={monthLabel}
                  onChange={(e) => setMonthLabel(e.target.value)}
                  placeholder="e.g., Jan-Feb 2026"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setMonthLabel(cycleInfo?.suggestedCycle || cycleInfo?.currentCycle || "")}
                  className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-lg transition"
                >
                  Suggested
                </button>
              </div>
              {cycleInfo?.currentCycle && (
                <p className="text-gray-600 text-sm mt-1">
                  Current cycle: {cycleInfo.currentCycle} | Next cycle: {cycleInfo.nextCycle}
                </p>
              )}
            </div>

            {/* State */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">State *</label>
              <select
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Tamil Nadu">Tamil Nadu</option>
                <option value="Karnataka">Karnataka</option>
                <option value="Maharashtra">Maharashtra</option>
              </select>
            </div>

            {/* Meter Status */}
            <div>
              <label className="mb-2 flex items-center gap-2 text-gray-700 font-medium">
                Meter Status
                <span
                  title="Use Normal for regular readings. Choose Tampered or Faulty only when there is a meter issue."
                  className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700 cursor-help"
                >
                  ?
                </span>
              </label>
              <select
                value={meterStatus}
                onChange={(e) => setMeterStatus(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="normal">Normal</option>
                <option value="tampered">Tampered</option>
                <option value="faulty">Faulty</option>
              </select>
            </div>

            {/* Remarks */}
            <div>
              <label className="mb-2 flex items-center gap-2 text-gray-700 font-medium">
                Remarks
                <span
                  title="Required when Meter Status is Tampered or Faulty. Add any relevant inspection notes here."
                  className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700 cursor-help"
                >
                  ?
                </span>
              </label>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Add any notes or remarks..."
                rows="3"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 rounded-lg transition"
            >
              {loading ? "Recording..." : "Record Reading"}
            </button>
          </form>
        </div>
      )}

      {/* Readings List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">All Meter Readings</h2>
          <p className="text-gray-600 text-sm">Total readings: {readings.length}</p>
        </div>

        {readings.length === 0 ? (
          <div className="p-6 text-center text-gray-600">
            No meter readings recorded yet. Start by recording your first reading.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Month</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Current Reading</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Previous</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Units Consumed</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Action</th>
                </tr>
              </thead>
              <tbody>
                {readings.map((reading) => (
                  <tr key={reading._id} className="border-b border-gray-200 hover:bg-gray-50 transition">
                    <td className="px-6 py-4 text-sm text-gray-800 font-medium">{reading.monthLabel}</td>
                    <td className="px-6 py-4 text-sm text-gray-800">{reading.readingValue} kWh</td>
                    <td className="px-6 py-4 text-sm text-gray-800">{reading.previousReading} kWh</td>
                    <td className="px-6 py-4 text-sm font-bold text-blue-600">{reading.unitsConsumed} kWh</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        reading.meterStatus === "normal"
                          ? "bg-green-100 text-green-700"
                          : reading.meterStatus === "tampered"
                          ? "bg-red-100 text-red-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}>
                        {reading.meterStatus.charAt(0).toUpperCase() + reading.meterStatus.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(reading.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <button
                        onClick={() => handleGenerateBill(reading)}
                        disabled={loading || Number(reading.unitsConsumed || 0) <= 0}
                        className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-3 py-1 rounded text-xs transition"
                      >
                        Generate Bill
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default MeterReading;
