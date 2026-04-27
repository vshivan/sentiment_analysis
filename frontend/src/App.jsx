import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import ProductPage from "./pages/ProductPage";
import AdminPanel from "./pages/AdminPanel";
import AnalyzePage from "./pages/AnalyzePage";
import ComparePage from "./pages/ComparePage";
import LeaderboardPage from "./pages/LeaderboardPage";
import AlertsPage from "./pages/AlertsPage";
import ImportPage from "./pages/ImportPage";
import ScrapePage from "./pages/ScrapePage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard"   element={<Dashboard />} />
        <Route path="product/:name" element={<ProductPage />} />
        <Route path="analyze"     element={<AnalyzePage />} />
        <Route path="compare"     element={<ComparePage />} />
        <Route path="leaderboard" element={<LeaderboardPage />} />
        <Route path="alerts"      element={<AlertsPage />} />
        <Route path="import"      element={<ImportPage />} />
        <Route path="scrape"      element={<ScrapePage />} />
        <Route path="admin"       element={<AdminPanel />} />
      </Route>
    </Routes>
  );
}
