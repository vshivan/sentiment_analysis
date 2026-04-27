import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchStats, exportAllURL } from "../api";
import StatCard, { StatCardSkeleton } from "../components/StatCard";
import SentimentBarChart from "../components/SentimentBarChart";
import SentimentPieChart from "../components/SentimentPieChart";
import {
  FileText, ThumbsUp, ThumbsDown, Minus,
  Download, ArrowRight, BarChart2, Activity
} from "lucide-react";
import styles from "./Dashboard.module.css";

const PRODUCT_ICONS = {
  Adidas:"👟", Zara:"👗", Dell:"💻", Supra:"👠",
  iPhone:"📱", Lenskart:"👓", "Lloyd AC":"❄️", "Titan Watch":"⌚"
};

const SENT_COLOR = {
  Positive: "var(--positive)",
  Negative: "var(--negative)",
  Neutral:  "var(--neutral)",
};

export default function Dashboard() {
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchStats()
      .then(r => setStats(r.data))
      .catch(() => setError("Could not load stats. Is the backend running on port 5000?"))
      .finally(() => setLoading(false));
  }, []);

  if (error) return (
    <div className={styles.errorState}>
      <div className={styles.errorIcon}>⚠️</div>
      <h2 className={styles.errorTitle}>Backend not reachable</h2>
      <p className={styles.errorMsg}>{error}</p>
      <button className={styles.retryBtn} onClick={() => window.location.reload()}>
        Retry
      </button>
    </div>
  );

  if (loading) return (
    <div className={`${styles.page} fade-in`}>
      <div className={styles.header}>
        <div>
          <div className="skeleton" style={{ height: 11, width: 100, marginBottom: 8 }} />
          <div className="skeleton" style={{ height: 28, width: 220, marginBottom: 8 }} />
          <div className="skeleton" style={{ height: 10, width: 280 }} />
        </div>
      </div>
      <div className={`${styles.statsGrid} stagger`}>
        {[...Array(4)].map((_, i) => <StatCardSkeleton key={i} />)}
      </div>
      <div className={styles.chartsRow}>
        <div className={`${styles.chartCard} skeleton`} style={{ height: 300 }} />
        <div className={`${styles.chartCard} skeleton`} style={{ height: 300 }} />
      </div>
    </div>
  );

  const { total_reviews, overall_sentiment, product_stats } = stats;
  const positivePct = ((overall_sentiment.Positive / total_reviews) * 100).toFixed(1);
  const negativePct = ((overall_sentiment.Negative / total_reviews) * 100).toFixed(1);

  return (
    <div className={`${styles.page} fade-in`}>
      {/* ── Header ── */}
      <div className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Overview</p>
          <h1 className={styles.title}>Sentiment Dashboard</h1>
          <p className={styles.subtitle}>
            Analyzing <strong style={{ color: "var(--text-2)" }}>{total_reviews}</strong> reviews
            across <strong style={{ color: "var(--text-2)" }}>{Object.keys(product_stats).length}</strong> products
          </p>
        </div>
        <div className={styles.headerActions}>
          <a href={exportAllURL()} download className={styles.exportBtn}>
            <Download size={13} />
            <span>Export CSV</span>
          </a>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className={`${styles.statsGrid} stagger`}>
        <StatCard
          title="Total Reviews"
          value={total_reviews}
          subtitle="Across all products"
          icon={<FileText size={18} />}
          accent="var(--accent)"
        />
        <StatCard
          title="Positive"
          value={overall_sentiment.Positive}
          subtitle={`${positivePct}% satisfaction rate`}
          icon={<ThumbsUp size={18} />}
          accent="var(--positive)"
          trend={1}
        />
        <StatCard
          title="Negative"
          value={overall_sentiment.Negative}
          subtitle={`${negativePct}% need attention`}
          icon={<ThumbsDown size={18} />}
          accent="var(--negative)"
          trend={-1}
        />
        <StatCard
          title="Neutral"
          value={overall_sentiment.Neutral}
          subtitle="Mixed or undecided"
          icon={<Minus size={18} />}
          accent="var(--neutral)"
          trend={0}
        />
      </div>

      {/* ── Charts ── */}
      <div className={styles.chartsRow}>
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <div className={styles.chartTitleGroup}>
              <BarChart2 size={15} style={{ color: "var(--accent-light)" }} />
              <h2 className={styles.chartTitle}>Sentiment by Product</h2>
            </div>
          </div>
          <SentimentBarChart productStats={product_stats} />
        </div>
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <div className={styles.chartTitleGroup}>
              <Activity size={15} style={{ color: "var(--accent-light)" }} />
              <h2 className={styles.chartTitle}>Overall Distribution</h2>
            </div>
          </div>
          <SentimentPieChart stats={overall_sentiment} />
        </div>
      </div>

      {/* ── Product grid ── */}
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Product Overview</h2>
        <span className={styles.sectionCount}>{Object.keys(product_stats).length} products</span>
      </div>

      <div className={`${styles.productGrid} stagger`}>
        {Object.entries(product_stats).map(([product, s]) => {
          const dominant =
            s.Positive >= s.Negative && s.Positive >= s.Neutral ? "Positive" :
            s.Negative >= s.Positive && s.Negative >= s.Neutral ? "Negative" : "Neutral";
          const domColor = SENT_COLOR[dominant];
          const health = s.positive_pct >= 60 ? "good" : s.negative_pct >= 40 ? "poor" : "fair";

          return (
            <button
              key={product}
              className={`${styles.productCard} fade-in`}
              onClick={() => navigate(`/product/${encodeURIComponent(product)}`)}
              aria-label={`View ${product} reviews`}
            >
              {/* Health indicator */}
              <div className={styles.healthBar} style={{
                background: health === "good" ? "var(--positive)" :
                            health === "poor" ? "var(--negative)" : "var(--neutral)",
                opacity: 0.6
              }} />

              <div className={styles.productTop}>
                <span className={styles.productEmoji}>{PRODUCT_ICONS[product] || "📦"}</span>
                <div className={styles.productInfo}>
                  <span className={styles.productName}>{product}</span>
                  <span className={styles.productCount}>{s.total} reviews</span>
                </div>
                <span className={styles.dominantBadge} style={{
                  color: domColor,
                  background: `${domColor}18`,
                  border: `1px solid ${domColor}30`
                }}>
                  {dominant}
                </span>
              </div>

              {/* Stacked sentiment bar */}
              <div className={styles.sentBar}>
                <div className={styles.sentBarPos} style={{ width: `${s.positive_pct}%` }}
                  title={`Positive: ${s.positive_pct}%`} />
                <div className={styles.sentBarNeu} style={{ width: `${s.neutral_pct}%` }}
                  title={`Neutral: ${s.neutral_pct}%`} />
                <div className={styles.sentBarNeg} style={{ width: `${s.negative_pct}%` }}
                  title={`Negative: ${s.negative_pct}%`} />
              </div>

              <div className={styles.productFooter}>
                <div className={styles.productStats}>
                  <span style={{ color: "var(--positive)" }}>↑ {s.Positive}</span>
                  <span style={{ color: "var(--neutral)" }}>→ {s.Neutral}</span>
                  <span style={{ color: "var(--negative)" }}>↓ {s.Negative}</span>
                </div>
                <ArrowRight size={13} className={styles.productArrow} />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
