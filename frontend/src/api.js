/**
 * Sentilytics — API Client
 * All requests include JWT Bearer token via axios defaults (set in AuthContext)
 */
import axios from "axios";

const BASE = "/api";
const client = axios.create({ baseURL: BASE });

// Attach JWT token from localStorage to every request
client.interceptors.request.use((config) => {
  const token = localStorage.getItem("senti_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Auth ─────────────────────────────────────────────────────────────────────
export const loginAPI    = (u, p)  => client.post("/auth/login", { username: u, password: p });
export const getMeAPI    = ()      => client.get("/auth/me");
export const registerAPI = (data)  => client.post("/auth/register", data);
export const getUsersAPI = ()      => client.get("/auth/users");
export const updateUserAPI = (id, data) => client.patch(`/auth/users/${id}`, data);

// ── Products ─────────────────────────────────────────────────────────────────
export const fetchProducts    = ()     => client.get("/products");
export const createProduct    = (data) => client.post("/products", data);
export const deleteProduct    = (id)   => client.delete(`/products/${id}`);

// ── Reviews ──────────────────────────────────────────────────────────────────
export const fetchReviews = (product, params = {}) =>
  client.get(`/reviews/${encodeURIComponent(product)}`, { params });
export const addReview    = (product, text, extra = {}) =>
  client.post(`/reviews/${encodeURIComponent(product)}/add`, { text, ...extra });
export const deleteReview = (product, id) =>
  client.delete(`/reviews/${encodeURIComponent(product)}/${id}`);
export const updateReview = (product, id, data) =>
  client.patch(`/reviews/${encodeURIComponent(product)}/${id}`, data);

// ── Analytics ────────────────────────────────────────────────────────────────
export const fetchStats       = ()          => client.get("/stats");
export const fetchKeywords    = (product)   => client.get(`/keywords/${encodeURIComponent(product)}`);
export const analyzeText      = (text)      => client.post("/analyze", { text });
export const analyzeImage     = (imageFile) => {
  const formData = new FormData();
  formData.append("image", imageFile);
  return client.post("/analyze-image", formData);
};
export const fetchLeaderboard = ()          => client.get("/leaderboard");
export const fetchAlerts      = (t = 40)    => client.get(`/alerts?threshold=${t}`);
export const fetchComparison  = (products)  =>
  client.get(`/compare?products=${products.map(encodeURIComponent).join(",")}`);

// ── Search ───────────────────────────────────────────────────────────────────
export const globalSearch = (q, page = 1) =>
  client.get(`/search?q=${encodeURIComponent(q)}&page=${page}`);

// ── Export (direct download URLs) ────────────────────────────────────────────
export const exportURL    = (product, fmt) => `${BASE}/export/${encodeURIComponent(product)}/${fmt}`;
export const exportAllURL = ()             => `${BASE}/export/all/csv`;

// ── Import / Scrape ──────────────────────────────────────────────────────────
export const bulkImport = (product, reviews) =>
  client.post(`/import/${encodeURIComponent(product)}`, { reviews });
export const scrapeURL  = (url) => client.post("/scrape", { url });

// ── Audit + Notifications ────────────────────────────────────────────────────
export const fetchAuditLogs    = (page = 1)  => client.get(`/audit?page=${page}`);
export const fetchNotifications = ()         => client.get("/notifications");
export const markNotifRead     = (id)        => client.patch(`/notifications/${id}/read`);
export const markAllRead       = ()          => client.patch("/notifications/read-all");

// ── Emotion (Camera) ──────────────────────────────────────────────────────────
export const logEmotion        = (data)      => client.post("/emotion-log", data);
export const fetchEmotionStats = (sessionId) =>
  client.get(`/emotion-stats${sessionId ? `?session_id=${sessionId}` : ""}`);

export default client;
