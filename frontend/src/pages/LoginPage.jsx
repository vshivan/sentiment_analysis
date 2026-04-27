import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Eye, EyeOff, LogIn, TrendingUp } from "lucide-react";
import styles from "./LoginPage.module.css";

const DEMO_ACCOUNTS = [
  { role: "Admin",   username: "admin",   password: "admin123",   color: "var(--cyan)" },
  { role: "Analyst", username: "analyst", password: "analyst123", color: "var(--positive)" },
  { role: "Viewer",  username: "viewer",  password: "viewer123",  color: "var(--neutral)" },
];

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd,  setShowPwd]  = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const { login } = useAuth();
  const navigate  = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) return;
    setLoading(true);
    setError("");
    try {
      await login(username.trim(), password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.error || "Login failed. Check credentials.");
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (acc) => {
    setUsername(acc.username);
    setPassword(acc.password);
    setError("");
  };

  return (
    <div className={styles.page}>
      {/* Background orbs */}
      <div className={styles.orb1} />
      <div className={styles.orb2} />
      <div className={styles.orb3} />

      <div className={styles.container}>
        {/* Left panel */}
        <div className={styles.leftPanel}>
          <div className={styles.brand}>
            <div className={styles.brandIcon}>✦</div>
            <div>
              <h1 className={styles.brandName}>Senti</h1>
              <p className={styles.brandTag}>ERP Analytics Platform</p>
            </div>
          </div>

          <div className={styles.heroText}>
            <h2 className={styles.heroTitle}>
              Understand your customers.<br />
              <span className={styles.heroAccent}>At scale.</span>
            </h2>
            <p className={styles.heroSub}>
              AI-powered sentiment analysis across products, reviews, and markets.
              Real-time insights for data-driven decisions.
            </p>
          </div>

          <div className={styles.features}>
            {[
              { icon: "📊", text: "Real-time sentiment dashboard" },
              { icon: "🔒", text: "Role-based access control" },
              { icon: "📈", text: "Product leaderboard & alerts" },
              { icon: "🌐", text: "URL review scraper" },
            ].map(f => (
              <div key={f.text} className={styles.featureItem}>
                <span>{f.icon}</span>
                <span>{f.text}</span>
              </div>
            ))}
          </div>

          <div className={styles.stats}>
            <div className={styles.stat}><span className={styles.statNum}>8</span><span className={styles.statLabel}>Products</span></div>
            <div className={styles.stat}><span className={styles.statNum}>40+</span><span className={styles.statLabel}>Reviews</span></div>
            <div className={styles.stat}><span className={styles.statNum}>15</span><span className={styles.statLabel}>API Endpoints</span></div>
          </div>
        </div>

        {/* Right panel — Login form */}
        <div className={styles.rightPanel}>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Sign in</h2>
              <p className={styles.cardSub}>Access your analytics dashboard</p>
            </div>

            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.field}>
                <label className={styles.label}>Username</label>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="Enter username"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  autoComplete="username"
                  autoFocus
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Password</label>
                <div className={styles.passwordWrap}>
                  <input
                    type={showPwd ? "text" : "password"}
                    className={styles.input}
                    placeholder="Enter password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    autoComplete="current-password"
                  />
                  <button type="button" className={styles.eyeBtn}
                    onClick={() => setShowPwd(v => !v)}>
                    {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {error && <div className={styles.errorMsg}>{error}</div>}

              <button type="submit" className={`btn-primary ${styles.submitBtn}`} disabled={loading}>
                {loading
                  ? <><span className={styles.btnSpinner} /> Signing in…</>
                  : <><LogIn size={15} /> Sign In</>
                }
              </button>
            </form>

            {/* Demo accounts */}
            <div className={styles.demoSection}>
              <p className={styles.demoLabel}>Demo accounts</p>
              <div className={styles.demoCards}>
                {DEMO_ACCOUNTS.map(acc => (
                  <button key={acc.role} className={styles.demoCard}
                    onClick={() => fillDemo(acc)} type="button">
                    <span className={styles.demoRole} style={{ color: acc.color }}>{acc.role}</span>
                    <span className={styles.demoUser}>{acc.username}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
