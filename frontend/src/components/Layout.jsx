import React, { useState, useEffect, useCallback } from "react";
import { Outlet, NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Settings, Zap, ChevronRight,
  PanelLeftClose, PanelLeftOpen, TrendingUp,
  GitCompareArrows, Trophy, Bell, Upload, Globe,
  Search, LogOut, Shield, User, FileText, Camera
} from "lucide-react";
import { fetchProducts, fetchNotifications, markAllRead } from "../api";
import { useAuth } from "../context/AuthContext";
import styles from "./Layout.module.css";

const PRODUCT_ICONS = {
  Adidas:"👟", Zara:"👗", Dell:"💻", Supra:"👠",
  iPhone:"📱", Lenskart:"👓", "Lloyd AC":"❄️", "Titan Watch":"⌚"
};

const PAGE_TITLES = {
  "/dashboard":"Dashboard","/leaderboard":"Leaderboard","/alerts":"Alerts",
  "/analyze":"Analyze Text","/scrape":"URL Scraper","/compare":"Compare",
  "/import":"Bulk Import","/admin":"Admin Panel","/audit":"Audit Log",
  "/search":"Global Search","/camera":"Live Camera"
};

// Inline SVG logo component for Sentilytics
const SentilyticsLogo = ({ size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="slogo" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#0099cc"/>
        <stop offset="50%" stopColor="#00d4ff"/>
        <stop offset="100%" stopColor="#00e5ff"/>
      </linearGradient>
    </defs>
    <circle cx="32" cy="32" r="30" fill="url(#slogo)" opacity="0.15"/>
    <path d="M10 32 L18 32 L22 18 L26 44 L30 24 L34 38 L38 20 L42 40 L46 28 L50 32 L54 32" 
          stroke="url(#slogo)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    <circle cx="22" cy="18" r="2.5" fill="#00d4ff"/>
    <circle cx="30" cy="24" r="2.5" fill="#00d4ff"/>
    <circle cx="38" cy="20" r="2.5" fill="#00d4ff"/>
    <circle cx="26" cy="44" r="2" fill="#00e676" opacity="0.8"/>
    <circle cx="34" cy="38" r="2" fill="#ffca28" opacity="0.8"/>
    <circle cx="42" cy="40" r="2" fill="#ff5252" opacity="0.8"/>
  </svg>
);

const NAV_MAIN  = [
  { to:"/dashboard",   icon:<LayoutDashboard size={16}/>, label:"Dashboard"   },
  { to:"/leaderboard", icon:<Trophy          size={16}/>, label:"Leaderboard" },
  { to:"/alerts",      icon:<Bell            size={16}/>, label:"Alerts"      },
];
const NAV_TOOLS = [
  { to:"/analyze", icon:<Zap              size={16}/>, label:"Analyze Text" },
  { to:"/camera",  icon:<Camera           size={16}/>, label:"Live Camera"  },
  { to:"/scrape",  icon:<Globe            size={16}/>, label:"URL Scraper"  },
  { to:"/compare", icon:<GitCompareArrows size={16}/>, label:"Compare"      },
  { to:"/import",  icon:<Upload           size={16}/>, label:"Bulk Import"  },
  { to:"/search",  icon:<Search           size={16}/>, label:"Global Search"},
  { to:"/audit",   icon:<Shield           size={16}/>, label:"Audit Log"    },
  { to:"/admin",   icon:<Settings         size={16}/>, label:"Admin Panel"  },
];

export default function Layout() {
  const [products,       setProducts]       = useState([]);
  const [open,           setOpen]           = useState(true);
  const [mobileOpen,     setMobileOpen]     = useState(false);
  const [notifs,         setNotifs]         = useState([]);
  const [unread,         setUnread]         = useState(0);
  const [showNotifs,     setShowNotifs]     = useState(false);
  const [showUserMenu,   setShowUserMenu]   = useState(false);
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    fetchProducts().then(r => setProducts(r.data.products)).catch(()=>{});
    loadNotifs();
    const t = setInterval(loadNotifs, 30000);
    return () => clearInterval(t);
  }, []);

  const loadNotifs = () => {
    fetchNotifications().then(r => {
      setNotifs(r.data.notifications);
      setUnread(r.data.unread);
    }).catch(()=>{});
  };

  useEffect(() => { setMobileOpen(false); setShowNotifs(false); setShowUserMenu(false); }, [location.pathname]);

  const pageTitle = PAGE_TITLES[location.pathname] ||
    (location.pathname.startsWith("/product/")
      ? decodeURIComponent(location.pathname.split("/product/")[1]) : "Sentilytics");

  const handleMarkAllRead = async () => {
    await markAllRead();
    setUnread(0);
    setNotifs(prev => prev.map(n => ({...n, is_read:true})));
  };

  const NavItem = useCallback(({ to, icon, label }) => (
    <NavLink to={to} className={({isActive}) => `${styles.navItem} ${isActive ? styles.navActive : ""}`}>
      <span className={styles.navIcon}>{icon}</span>
      {open && <span className={styles.navLabel}>{label}</span>}
      {open && <span className={styles.navIndicator}/>}
    </NavLink>
  ), [open]);

  const ROLE_COLOR = { admin:"var(--cyan)", analyst:"var(--positive)", viewer:"var(--neutral)" };

  return (
    <div className={styles.shell}>
      {mobileOpen && <div className={styles.overlay} onClick={()=>setMobileOpen(false)}/>}

      <aside className={`${styles.sidebar} ${open?styles.sidebarOpen:styles.sidebarCollapsed} ${mobileOpen?styles.sidebarMobileOpen:""}`}>
        <div className={styles.logo}>
          <div className={styles.logoMark}><SentilyticsLogo size={28} /></div>
          {open && <div className={styles.logoText}><span className={styles.logoName}>Sentilytics</span><span className={styles.logoTag}>AI Analytics</span></div>}
        </div>
        <button className={styles.toggleBtn} onClick={()=>setOpen(v=>!v)} aria-label="Toggle sidebar">
          {open ? <PanelLeftClose size={14}/> : <PanelLeftOpen size={14}/>}
        </button>

        <nav className={styles.nav}>
          {open && <p className={styles.navSection}>Overview</p>}
          {!open && <div className={styles.navDivider}/>}
          {NAV_MAIN.map(n => <NavItem key={n.to} {...n}/>)}

          {open && <p className={styles.navSection} style={{marginTop:"1.25rem"}}>Tools</p>}
          {!open && <div className={styles.navDivider}/>}
          {NAV_TOOLS.map(n => <NavItem key={n.to} {...n}/>)}

          {open && <p className={styles.navSection} style={{marginTop:"1.25rem"}}>Products</p>}
          {!open && <div className={styles.navDivider}/>}
          {products.map(p => (
            <NavLink key={p} to={`/product/${encodeURIComponent(p)}`}
              className={({isActive}) => `${styles.navItem} ${isActive?styles.navActive:""}`}>
              <span className={styles.navIcon} style={{fontSize:"0.9rem"}}>{PRODUCT_ICONS[p]||"📦"}</span>
              {open && <><span className={styles.navLabel}>{p}</span><ChevronRight size={11} className={styles.chevron}/></>}
            </NavLink>
          ))}
        </nav>

        {open && (
          <div className={styles.sidebarFooter}>
            <div className={styles.footerDot}/>
            <span>Sentilytics v2.0</span>
            <span className={styles.footerSep}>·</span>
            <span>{products.length} products</span>
          </div>
        )}
      </aside>

      <div className={styles.mainWrap}>
        <header className={styles.topbar}>
          <button className={styles.mobileMenuBtn} onClick={()=>setMobileOpen(v=>!v)}>
            <span/><span/><span/>
          </button>
          <div className={styles.breadcrumb}>
            <span className={styles.breadcrumbRoot}>Sentilytics</span>
            <ChevronRight size={12} className={styles.breadcrumbSep}/>
            <span className={styles.breadcrumbCurrent}>{pageTitle}</span>
          </div>

          <div className={styles.topbarRight}>
            {/* Notifications */}
            <div className={styles.notifWrap}>
              <button className={styles.iconBtn} onClick={()=>{setShowNotifs(v=>!v);setShowUserMenu(false);}}>
                <Bell size={16}/>
                {unread > 0 && <span className={styles.badge}>{unread > 9 ? "9+" : unread}</span>}
              </button>
              {showNotifs && (
                <div className={styles.notifDropdown}>
                  <div className={styles.notifHeader}>
                    <span>Notifications</span>
                    {unread > 0 && <button className={styles.markAllBtn} onClick={handleMarkAllRead}>Mark all read</button>}
                  </div>
                  <div className={styles.notifList}>
                    {notifs.length === 0
                      ? <p className={styles.notifEmpty}>No notifications</p>
                      : notifs.slice(0,8).map(n => (
                        <div key={n.id} className={`${styles.notifItem} ${!n.is_read?styles.notifUnread:""}`}>
                          <div className={styles.notifDot} style={{
                            background: n.type==="alert"?"var(--negative)":n.type==="warning"?"var(--neutral)":n.type==="success"?"var(--positive)":"var(--cyan)"
                          }}/>
                          <div>
                            <p className={styles.notifTitle}>{n.title}</p>
                            <p className={styles.notifMsg}>{n.message}</p>
                            <p className={styles.notifTime}>{new Date(n.created_at).toLocaleString()}</p>
                          </div>
                        </div>
                      ))
                    }
                  </div>
                </div>
              )}
            </div>

            {/* User menu */}
            <div className={styles.userWrap}>
              <button className={styles.userBtn} onClick={()=>{setShowUserMenu(v=>!v);setShowNotifs(false);}}>
                <div className={styles.avatar}>{user?.username?.[0]?.toUpperCase()||"U"}</div>
                {open && <div className={styles.userInfo}>
                  <span className={styles.userName}>{user?.username}</span>
                  <span className={styles.userRole} style={{color:ROLE_COLOR[user?.role]||"var(--text-4)"}}>{user?.role}</span>
                </div>}
              </button>
              {showUserMenu && (
                <div className={styles.userDropdown}>
                  <div className={styles.userDropdownHeader}>
                    <p className={styles.udName}>{user?.username}</p>
                    <p className={styles.udEmail}>{user?.email}</p>
                    <span className={styles.udRole} style={{color:ROLE_COLOR[user?.role]}}>{user?.role}</span>
                  </div>
                  {isAdmin && (
                    <button className={styles.udItem} onClick={()=>navigate("/admin")}>
                      <Settings size={14}/> Admin Panel
                    </button>
                  )}
                  <button className={styles.udItem} onClick={()=>navigate("/audit")}>
                    <Shield size={14}/> Audit Log
                  </button>
                  <div className={styles.udDivider}/>
                  <button className={`${styles.udItem} ${styles.udLogout}`} onClick={logout}>
                    <LogOut size={14}/> Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className={styles.main}>
          <Outlet/>
        </main>
      </div>
    </div>
  );
}
