import React, { useState, useEffect } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Settings, Zap, ChevronRight,
  Menu, X, TrendingUp, GitCompareArrows,
  Trophy, Bell, Upload, Globe
} from "lucide-react";
import { fetchProducts } from "../api";
import styles from "./Layout.module.css";

const PRODUCT_ICONS = {
  Adidas:"👟", Zara:"👗", Dell:"💻", Supra:"👠",
  iPhone:"📱", Lenskart:"👓", "Lloyd AC":"❄️", "Titan Watch":"⌚"
};

export default function Layout() {
  const [products,    setProducts]    = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    fetchProducts().then(r => setProducts(r.data.products)).catch(() => {});
  }, []);

  const navLink = (to, icon, label) => (
    <NavLink to={to} className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ""}`}>
      {icon}
      {sidebarOpen && <span>{label}</span>}
    </NavLink>
  );

  return (
    <div className={styles.shell}>
      {/* ── Sidebar ── */}
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.open : styles.collapsed}`}>

        {/* Logo */}
        <div className={styles.logo}>
          <div className={styles.logoIcon}>✦</div>
          {sidebarOpen && <span className={styles.logoText}>Senti</span>}
        </div>

        {/* Toggle */}
        <button className={styles.toggleBtn} onClick={() => setSidebarOpen(v => !v)} aria-label="Toggle sidebar">
          {sidebarOpen ? <X size={14} /> : <Menu size={14} />}
        </button>

        {/* Nav */}
        <nav className={styles.nav}>
          {sidebarOpen && <p className={styles.navLabel}>Overview</p>}
          {navLink("/dashboard",   <LayoutDashboard size={16} />, "Dashboard")}
          {navLink("/leaderboard", <Trophy size={16} />,          "Leaderboard")}
          {navLink("/alerts",      <Bell size={16} />,            "Alerts")}

          {sidebarOpen && <p className={styles.navLabel} style={{ marginTop:"1rem" }}>Tools</p>}
          {navLink("/analyze", <Zap size={16} />,              "Analyze Text")}
          {navLink("/scrape",  <Globe size={16} />,            "URL Scraper")}
          {navLink("/compare", <GitCompareArrows size={16} />, "Compare")}
          {navLink("/import",  <Upload size={16} />,           "Bulk Import")}
          {navLink("/admin",   <Settings size={16} />,         "Admin Panel")}

          {/* Products */}
          {sidebarOpen && <p className={styles.navLabel} style={{ marginTop:"1rem" }}>Products</p>}
          {!sidebarOpen && <div className={styles.navDivider} />}
          {products.map(p => (
            <NavLink
              key={p}
              to={`/product/${encodeURIComponent(p)}`}
              className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ""}`}
            >
              <span className={styles.productIcon}>{PRODUCT_ICONS[p] || "📦"}</span>
              {sidebarOpen && (
                <>
                  <span className={styles.productName}>{p}</span>
                  <ChevronRight size={12} className={styles.chevron} />
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        {sidebarOpen && (
          <div className={styles.sidebarFooter}>
            <TrendingUp size={12} />
            <span>Senti v2.0</span>
          </div>
        )}
      </aside>

      {/* ── Main ── */}
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}
