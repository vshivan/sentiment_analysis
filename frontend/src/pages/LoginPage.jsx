import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Eye, EyeOff, LogIn } from "lucide-react";
import styles from "./LoginPage.module.css";

// Inline SVG logo for the login page
const SentilyticsLogo = ({ size = 44 }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="loginLogo" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#0099cc"/>
        <stop offset="50%" stopColor="#00d4ff"/>
        <stop offset="100%" stopColor="#00e5ff"/>
      </linearGradient>
    </defs>
    <circle cx="32" cy="32" r="30" fill="url(#loginLogo)" opacity="0.15"/>
    <circle cx="32" cy="32" r="28" stroke="url(#loginLogo)" strokeWidth="1.5" fill="none" opacity="0.3"/>
    <path d="M10 32 L18 32 L22 18 L26 44 L30 24 L34 38 L38 20 L42 40 L46 28 L50 32 L54 32" 
          stroke="url(#loginLogo)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    <circle cx="22" cy="18" r="2.5" fill="#00d4ff"/>
    <circle cx="30" cy="24" r="2.5" fill="#00d4ff"/>
    <circle cx="38" cy="20" r="2.5" fill="#00d4ff"/>
    <circle cx="26" cy="44" r="2" fill="#00e676" opacity="0.8"/>
    <circle cx="34" cy="38" r="2" fill="#ffca28" opacity="0.8"/>
    <circle cx="42" cy="40" r="2" fill="#ff5252" opacity="0.8"/>
  </svg>
);

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
      setError(err.response?.data?.error || "Login failed. Check your credentials.");
    } finally {
      setLoading(false);
    }
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
            <div className={styles.brandIcon}><SentilyticsLogo size={44} /></div>
            <div>
              <h1 className={styles.brandName}>Sentilytics</h1>
              <p className={styles.brandTag}>AI Sentiment Analytics</p>
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
          </div>
        </div>
      </div>
    </div>
  );
}
