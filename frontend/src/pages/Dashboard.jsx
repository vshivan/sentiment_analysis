import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchStats, exportAllURL } from "../api";
import StatCard from "../components/StatCard";
import SentimentBarChart from "../components/SentimentBarChart";
import SentimentPieChart from "../components/SentimentPieChart";
import Spinner from "../components/Spinner";
import { Download } from "lucide-react";
import styles from "./Dashboard.module.css";

const PRODUCT_ICONS = {
  Adidas: "👟", Zara: "👗", Dell: "💻", Supra: "👠",
  iPhone: "📱", Lenskart: "👓", "Lloyd AC": "❄️", "Titan Watch": "⌚"
};

export default function Dashboard() {
  const [stats, setStats]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchStats()
      .then(r => setStats(r.data))
      .catch(() => setError("Could not load stats. Is the backend running?"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner label="Loading dashboard…" />;
  if (error)   return <div className={styles.error}>{error}</div>;

  const { total_reviews, overall_sentiment, product_stats } = stats;
  const positivePct = ((overall_sentiment.Positive / total_reviews) * 100).toFixed(1);

  return (
    <div className={`${styles.page} fade-in`}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.titleBlock}>
          <p className={styles.greeting}>Welcome back</p>
          <h1 className={styles.title}>Senti Dashboard</h1>
          <p className={styles.subtitle}>Real-time sentiment insights across all products</p>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.liveBadge}>
            <span className={styles.liveDot} />
            LIVE
          </div>
          <a href={exportAllURL()} download className={styles.exportAllBtn}>
            <Download size={13} /> Export All CSV
          </a>
        </div>
      </div>

      {/* Top stat cards */}
      <div className={styles.statsGrid}>
        <StatCard
          title="Total Reviews"
          value={total_reviews}
          subtitle="Across all products"
          icon="📝"
          accent="var(--accent)"
        />
        <StatCard
          title="Positive Reviews"
          value={overall_sentiment.Positive}
          subtitle={`${positivePct}% of all reviews`}
          icon="😊"
          accent="var(--positive)"
        />
        <StatCard
          title="Negative Reviews"
          value={overall_sentiment.Negative}
          subtitle="Need attention"
          icon="😞"
          accent="var(--negative)"
        />
        <StatCard
          title="Neutral Reviews"
          value={overall_sentiment.Neutral}
          subtitle="Mixed feedback"
          icon="😐"
          accent="var(--neutral)"
        />
      </div>

      {/* Charts row */}
      <div className={styles.chartsRow}>
        <div className={styles.chartCard}>
          <h2 className={styles.cardTitle}>Sentiment by Product</h2>
          <SentimentBarChart productStats={product_stats} />
        </div>
        <div className={styles.chartCard}>
          <h2 className={styles.cardTitle}>Overall Distribution</h2>
          <SentimentPieChart stats={overall_sentiment} />
        </div>
      </div>

      {/* Product grid */}
      <h2 className={styles.sectionTitle}>Product Overview</h2>
      <div className={styles.productGrid}>
        {Object.entries(product_stats).map(([product, s]) => {
          const dominant =
            s.Positive >= s.Negative && s.Positive >= s.Neutral ? "Positive" :
            s.Negative >= s.Positive && s.Negative >= s.Neutral ? "Negative" : "Neutral";
          const domColor = { Positive: "var(--positive)", Negative: "var(--negative)", Neutral: "var(--neutral)" }[dominant];

          return (
            <button
              key={product}
              className={styles.productCard}
              onClick={() => navigate(`/product/${encodeURIComponent(product)}`)}
              aria-label={`View ${product} reviews`}
            >
              <div className={styles.productHeader}>
                <span className={styles.productEmoji}>{PRODUCT_ICONS[product] || "📦"}</span>
                <span className={styles.productName}>{product}</span>
                <span className={styles.dominantBadge} style={{ color: domColor, background: `${domColor}22` }}>
                  {dominant}
                </span>
              </div>
              <div className={styles.miniBar}>
                <div
                  className={styles.miniBarFill}
                  style={{ width: `${s.positive_pct}%`, background: "var(--positive)" }}
                  title={`Positive: ${s.positive_pct}%`}
                />
                <div
                  className={styles.miniBarFill}
                  style={{ width: `${s.neutral_pct}%`, background: "var(--neutral)" }}
                  title={`Neutral: ${s.neutral_pct}%`}
                />
                <div
                  className={styles.miniBarFill}
                  style={{ width: `${s.negative_pct}%`, background: "var(--negative)" }}
                  title={`Negative: ${s.negative_pct}%`}
                />
              </div>
              <div className={styles.productMeta}>
                <span>{s.total} reviews</span>
                <span style={{ color: "var(--positive)" }}>+{s.Positive}</span>
                <span style={{ color: "var(--negative)" }}>−{s.Negative}</span>
                <span style={{ color: "var(--neutral)" }}>~{s.Neutral}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
