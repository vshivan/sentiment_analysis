import React, { useState, useEffect, useCallback } from "react";
import { Outlet, NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Settings, Zap, ChevronRight,
  PanelLeftClose, PanelLeftOpen, TrendingUp,
  GitCompareArrows, Trophy, Bell, Upload, Globe,
  Package
} from "lucide-react";
import { fetchProducts } from "../api";
import styles from "./Layout.module.css";

const PRODUCT_ICONS = {
  Adidas:"👟", Zara:"👗", Dell:"💻", Supra:"👠",
  iPhone:"📱", Lenskart:"👓", "Lloyd AC":"❄️", "Titan Watch":"⌚"
};

const PAGE_TITLES = {
  "/dashboard":   "Dashboard",
  "/leaderboard": "Leaderboard",
  "/alerts":      "Alerts",
  "/analyze":     "Analyze Text",
  "/scrape":      "URL Scraper",
  "/compare":     "Compare",
  "/import":      "Bulk Import",
  "/admin":       "Admin Panel",
};

const NAV_MAIN = [
  { to: "/dashboard",   icon: <LayoutDashboard size={16} />, label: "Dashboard"   },
  { to: "/leaderboard", icon: <Trophy          size={16} />, label: "Leaderboard" },
  { to: "/alerts",      icon: <Bell            size={16} />, label: "Alerts"      },
];

const NAV_TOOLS = [
  { to: "/analyze", icon: <Zap              size={16} />, label: "Analyze Text" },
  { to: "/scrape",  icon: <Globe            size={16} />, label: "URL Scraper"  },
  { to: "/compare", icon: <GitCompareArrows size={16} />, label: "Compare"      },
  { to: "/import",  icon: <Upload           size={16} />, label: "Bulk Import"  },
  { to: "/admin",   icon: <Settings         size={16} />, label: "Admin Panel"  },
];

export default function Layout() {
  const [products,    setProducts]    = useState([]);
  const [open,        setOpen]        = useState(true);
  const [mobileOpen,  setMobileOpen]  = useState(false);
  const location = useLocation();

  useEffect(() => {
    fetchProducts().then(r => setProducts(r.data.products)).catch(() => {});
  }, []);

  // Close mobile sidebar on route change
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  // Current page title
  const pageTitle = PAGE_TITLES[location.pathname] ||
    (location.pathname.startsWith("/product/")
      ? decodeURIComponent(location.pathname.split("/product/")[1])
      : "Senti");

  const NavItem = useCallback(({ to, icon, label }) => (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `${styles.navItem} ${isActive ? styles.navActive : ""}`
      }
    >
      <span className={styles.navIcon}>{icon}</span>
      {open && <span className={styles.navLabel}>{label}</span>}
      {open && <span className={styles.navIndicator} />}
    </NavLink>
  ), [open]);

  return (
    <div className={styles.shell}>
      {/* ── Mobile overlay ── */}
      {mobileOpen && (
        <div className={styles.overlay} onClick={() => setMobileOpen(false)} />
      )}

      {/* ── Sidebar ── */}
      <aside className={`${styles.sidebar} ${open ? styles.sidebarOpen : styles.sidebarCollapsed} ${mobileOpen ? styles.sidebarMobileOpen : ""}`}>

        {/* Logo */}
        <div className={styles.logo}>
          <div className={styles.logoMark}>
            <span>✦</span>
          </div>
          {open && (
            <div className={styles.logoText}>
              <span className={styles.logoName}>Senti</span>
              <span className={styles.logoTag}>Analytics</span>
            </div>
          )}
        </div>

        {/* Toggle */}
        <button
          className={styles.toggleBtn}
          onClick={() => setOpen(v => !v)}
          aria-label={open ? "Collapse sidebar" : "Expand sidebar"}
          title={open ? "Collapse" : "Expand"}
        >
          {open ? <PanelLeftClose size={15} /> : <PanelLeftOpen size={15} />}
        </button>

        {/* Nav */}
        <nav className={styles.nav} aria-label="Main navigation">
          {open && <p className={styles.navSection}>Overview</p>}
          {!open && <div className={styles.navDivider} />}
          {NAV_MAIN.map(n => <NavItem key={n.to} {...n} />)}

          {open && <p className={styles.navSection} style={{ marginTop: "1.25rem" }}>Tools</p>}
          {!open && <div className={styles.navDivider} />}
          {NAV_TOOLS.map(n => <NavItem key={n.to} {...n} />)}

          {open && <p className={styles.navSection} style={{ marginTop: "1.25rem" }}>Products</p>}
          {!open && <div className={styles.navDivider} />}
          {products.map(p => (
            <NavLink
              key={p}
              to={`/product/${encodeURIComponent(p)}`}
              className={({ isActive }) =>
                `${styles.navItem} ${isActive ? styles.navActive : ""}`
              }
            >
              <span className={styles.navIcon} style={{ fontSize: "0.9rem" }}>
                {PRODUCT_ICONS[p] || "📦"}
              </span>
              {open && (
                <>
                  <span className={styles.navLabel}>{p}</span>
                  <ChevronRight size={11} className={styles.chevron} />
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        {open && (
          <div className={styles.sidebarFooter}>
            <div className={styles.footerDot} />
            <span>Senti v2.0</span>
            <span className={styles.footerSep}>·</span>
            <span>{products.length} products</span>
          </div>
        )}
      </aside>

      {/* ── Main area ── */}
      <div className={styles.mainWrap}>
        {/* Topbar */}
        <header className={styles.topbar}>
          {/* Mobile menu button */}
          <button
            className={styles.mobileMenuBtn}
            onClick={() => setMobileOpen(v => !v)}
            aria-label="Open menu"
          >
            <span /><span /><span />
          </button>

          {/* Breadcrumb */}
          <div className={styles.breadcrumb}>
            <span className={styles.breadcrumbRoot}>Senti</span>
            <ChevronRight size={13} className={styles.breadcrumbSep} />
            <span className={styles.breadcrumbCurrent}>{pageTitle}</span>
          </div>

          {/* Right side */}
          <div className={styles.topbarRight}>
            <div className={styles.statusPill}>
              <span className={styles.statusDot} />
              <span>Live</span>
            </div>
            <div className={styles.topbarAvatar} title="Senti User">S</div>
          </div>
        </header>

        {/* Page content */}
        <main className={styles.main}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
