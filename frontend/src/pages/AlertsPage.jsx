import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { fetchAlerts } from "../api";
import Spinner from "../components/Spinner";
import { Bell, AlertTriangle, ShieldAlert, CheckCircle, SlidersHorizontal } from "lucide-react";
import styles from "./AlertsPage.module.css";

const PRODUCT_ICONS = {
  Adidas:"👟", Zara:"👗", Dell:"💻", Supra:"👠",
  iPhone:"📱", Lenskart:"👓", "Lloyd AC":"❄️", "Titan Watch":"⌚"
};

export default function AlertsPage() {
  const [alerts,    setAlerts]    = useState([]);
  const [threshold, setThreshold] = useState(40);
  const [loading,   setLoading]   = useState(true);
  const navigate = useNavigate();

  const load = useCallback((t) => {
    setLoading(true);
    fetchAlerts(t)
      .then(r => setAlerts(r.data.alerts))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(threshold); }, []);

  const handleThreshold = (val) => {
    setThreshold(val);
    load(val);
  };

  return (
    <div className={`${styles.page} fade-in`}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Monitoring</p>
          <h1 className={styles.title}>
            <Bell size={20} style={{ verticalAlign:"middle", marginRight:8, color:"var(--negative)" }} />
            Sentiment Alerts
          </h1>
          <p className={styles.subtitle}>Products with high negative sentiment that need attention</p>
        </div>

        {/* Threshold control */}
        <div className={styles.thresholdBox}>
          <SlidersHorizontal size={14} style={{ color:"var(--text-muted)" }} />
          <span className={styles.thresholdLabel}>Alert threshold</span>
          <div className={styles.thresholdBtns}>
            {[20, 30, 40, 50, 60].map(t => (
              <button
                key={t}
                className={`${styles.thresholdBtn} ${threshold === t ? styles.thresholdActive : ""}`}
                onClick={() => handleThreshold(t)}
              >{t}%</button>
            ))}
          </div>
        </div>
      </div>

      {/* Summary strip */}
      <div className={styles.summaryStrip}>
        <div className={styles.summaryItem}>
          <span className={styles.summaryNum} style={{ color:"var(--negative)" }}>{alerts.length}</span>
          <span className={styles.summaryLabel}>Products Flagged</span>
        </div>
        <div className={styles.summaryItem}>
          <span className={styles.summaryNum} style={{ color:"#f87171" }}>
            {alerts.filter(a => a.severity === "high").length}
          </span>
          <span className={styles.summaryLabel}>High Severity</span>
        </div>
        <div className={styles.summaryItem}>
          <span className={styles.summaryNum} style={{ color:"var(--neutral)" }}>
            {alerts.filter(a => a.severity === "medium").length}
          </span>
          <span className={styles.summaryLabel}>Medium Severity</span>
        </div>
        <div className={styles.summaryItem}>
          <span className={styles.summaryNum} style={{ color:"var(--positive)" }}>
            {8 - alerts.length}
          </span>
          <span className={styles.summaryLabel}>Products Healthy</span>
        </div>
      </div>

      {loading ? <Spinner label="Scanning products…" /> : (
        <>
          {alerts.length === 0 ? (
            <div className={styles.allClear}>
              <CheckCircle size={40} style={{ color:"var(--positive)", opacity:0.7 }} />
              <p className={styles.allClearTitle}>All Clear!</p>
              <p className={styles.allClearSub}>No products exceed {threshold}% negative sentiment</p>
            </div>
          ) : (
            <div className={styles.alertsList}>
              {alerts.map(alert => (
                <div
                  key={alert.product}
                  className={`${styles.alertCard} ${alert.severity === "high" ? styles.alertHigh : styles.alertMedium}`}
                  onClick={() => navigate(`/product/${encodeURIComponent(alert.product)}`)}
                >
                  {/* Severity icon */}
                  <div className={styles.alertIcon}>
                    {alert.severity === "high"
                      ? <ShieldAlert size={22} style={{ color:"var(--negative)" }} />
                      : <AlertTriangle size={22} style={{ color:"var(--neutral)" }} />
                    }
                  </div>

                  {/* Product info */}
                  <div className={styles.alertBody}>
                    <div className={styles.alertTop}>
                      <span className={styles.alertEmoji}>{PRODUCT_ICONS[alert.product] || "📦"}</span>
                      <span className={styles.alertProduct}>{alert.product}</span>
                      <span className={`${styles.severityBadge} ${alert.severity === "high" ? styles.sevHigh : styles.sevMedium}`}>
                        {alert.severity === "high" ? "⚠ High" : "△ Medium"}
                      </span>
                    </div>

                    <p className={styles.alertDesc}>
                      <strong style={{ color:"var(--negative)" }}>{alert.negative_pct}%</strong> of {alert.total} reviews are negative
                      ({alert.negative} reviews) · Avg score: <strong style={{
                        color: alert.avg_score < 0 ? "var(--negative)" : "var(--neutral)"
                      }}>{alert.avg_score}</strong>
                    </p>

                    {/* Negative bar */}
                    <div className={styles.alertBar}>
                      <div
                        className={styles.alertBarFill}
                        style={{
                          width: `${alert.negative_pct}%`,
                          background: alert.severity === "high" ? "var(--negative)" : "var(--neutral)"
                        }}
                      />
                    </div>
                  </div>

                  <span className={styles.alertArrow}>→</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
