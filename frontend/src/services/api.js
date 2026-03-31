import axios from "axios";

const isLocalHost =
  typeof window !== "undefined" &&
  ["localhost", "127.0.0.1"].includes(window.location.hostname);

const rawBaseUrl = import.meta.env.VITE_API_URL || (isLocalHost ? "http://localhost:5001" : "https://eb-bill-generator.onrender.com");
const normalizedBaseUrl = String(rawBaseUrl).replace(/\/$/, "");

const api = axios.create({
  baseURL: `${normalizedBaseUrl}/api`
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
