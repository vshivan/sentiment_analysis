import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Layout from "./components/Layout";
import LoginPage     from "./pages/LoginPage";
import Dashboard     from "./pages/Dashboard";
import ProductPage   from "./pages/ProductPage";
import AdminPanel    from "./pages/AdminPanel";
import AnalyzePage   from "./pages/AnalyzePage";
import ComparePage   from "./pages/ComparePage";
import LeaderboardPage from "./pages/LeaderboardPage";
import AlertsPage    from "./pages/AlertsPage";
import ImportPage    from "./pages/ImportPage";
import ScrapePage    from "./pages/ScrapePage";
import AuditPage     from "./pages/AuditPage";
import SearchPage    from "./pages/SearchPage";
import CameraPage    from "./pages/CameraPage";
import Spinner       from "./components/Spinner";

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100vh" }}><Spinner label="Loading…" /></div>;
  if (!user)   return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index            element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard"   element={<Dashboard />} />
        <Route path="product/:name" element={<ProductPage />} />
        <Route path="analyze"     element={<AnalyzePage />} />
        <Route path="scrape"      element={<ScrapePage />} />
        <Route path="compare"     element={<ComparePage />} />
        <Route path="leaderboard" element={<LeaderboardPage />} />
        <Route path="alerts"      element={<AlertsPage />} />
        <Route path="import"      element={<ImportPage />} />
        <Route path="search"      element={<SearchPage />} />
        <Route path="audit"       element={<AuditPage />} />
        <Route path="admin"       element={<AdminPanel />} />
        <Route path="camera"      element={<CameraPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
