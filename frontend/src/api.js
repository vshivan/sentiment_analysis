/**
 * Senti API client
 * All requests go through Vite's /api proxy → Flask :5000
 */
import axios from "axios";

const BASE = "/api";

const client = axios.create({ baseURL: BASE });

export const fetchProducts   = ()          => client.get("/products");
export const fetchReviews    = (product)   => client.get(`/reviews/${encodeURIComponent(product)}`);
export const fetchStats      = ()          => client.get("/stats");
export const fetchKeywords   = (product)   => client.get(`/keywords/${encodeURIComponent(product)}`);
export const analyzeText     = (text)      => client.post("/analyze", { text });
export const addReview       = (product, text) =>
  client.post(`/reviews/${encodeURIComponent(product)}/add`, { text });
export const deleteReview    = (product, id) =>
  client.delete(`/reviews/${encodeURIComponent(product)}/${id}`);

// ── Export ──────────────────────────────────────────────────────────────────
export const exportURL    = (product, fmt) => `${BASE}/export/${encodeURIComponent(product)}/${fmt}`;
export const exportAllURL = ()             => `${BASE}/export/all/csv`;

// ── Compare ─────────────────────────────────────────────────────────────────
export const fetchComparison = (products) =>
  client.get(`/compare?products=${products.map(encodeURIComponent).join(",")}`);

// ── Leaderboard ──────────────────────────────────────────────────────────────
export const fetchLeaderboard = () => client.get("/leaderboard");

// ── Bulk Import ──────────────────────────────────────────────────────────────
export const bulkImport = (product, reviews) =>
  client.post(`/import/${encodeURIComponent(product)}`, { reviews });

// ── Alerts ───────────────────────────────────────────────────────────────────
export const fetchAlerts = (threshold = 40) => client.get(`/alerts?threshold=${threshold}`);

// ── URL Scraper ───────────────────────────────────────────────────────────────
export const scrapeURL = (url) => client.post("/scrape", { url });