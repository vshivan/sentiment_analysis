import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchLeaderboard } from "../api";
import Spinner from "../components/Spinner";
import { Trophy, TrendingUp, TrendingDown, Minus } from "lucide-react";
import styles from "./LeaderboardPage.module.css";

const PRODUCT_ICONS = {
  Adidas:"👟", Zara:"👗", Dell:"💻", Supra:"👠",
  iPhone:"📱", Lenskart:"👓", "Lloyd AC":"❄️", "Titan Watch":"⌚"
};

const RANK_STYLES = [
  { bg: "rgba(251,191,36,0.12)", border: "rgba(251,191,36,0.3)", color: "#fbbf24", label: "🥇" },
  { bg: "rgba(156,163,175,0.10)", border: "rgba(156,163,175,0.25)", color: "#9ca3af", label: "🥈" },
  { bg: "rgba(180,120,60,0.10)", border: "rgba(180,120,60,0.25)", color: "#b4783c", label: "🥉" },
];

export default function LeaderboardPage() {
  const [board,   setBoard]   = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchLeaderboard()
      .then(r => setBoard(r.data.leaderboard))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner label="Building leaderboard…" />;

  return (
    <div className={`${styles.page} fade-in`}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Rankings</p>
          <h1 className={styles.title}>
            <Trophy size={22} style={{ verticalAlign:"middle", marginRight:8, color:"#fbbf24" }} />
            Sentiment Leaderboard
          </h1>
          <p className={styles.subtitle}>Products ranked by positive sentiment percentage</p>
        </div>
      </div>

      {/* Podium — top 3 */}
      <div className={styles.podium}>
        {board.slice(0, 3).map((item, i) => {
          const rs = RANK_STYLES[i];
          return (
            <div
              key={item.product}
              className={`${styles.podiumCard} ${i === 0 ? styles.podiumFirst : ""}`}
              style={{ background: rs.bg, borderColor: rs.border }}
              onClick={() => navigate(`/product/${encodeURIComponent(item.product)}`)}
            >
              <span className={styles.podiumRankLabel}>{rs.label}</span>
              <span className={styles.podiumEmoji}>{PRODUCT_ICONS[item.product] || "📦"}</span>
              <p className={styles.podiumName}>{item.product}</p>
              <p className={styles.podiumScore} style={{ color: rs.color }}>
                {item.positive_pct}%
              </p>
              <p className={styles.podiumSub}>positive</p>
              <div className={styles.podiumBar}>
                <div style={{ width: `${item.positive_pct}%`, background: "#4ade80", opacity: 0.7 }} />
                <div style={{ width: `${item.neutral_pct}%`,  background: "#fbbf24", opacity: 0.7 }} />
                <div style={{ width: `${item.negative_pct}%`, background: "#f87171", opacity: 0.7 }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Full table */}
      <div className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <h2 className={styles.tableTitle}>Full Rankings</h2>
          <span className={styles.tableSub}>{board.length} products</span>
        </div>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>#</th>
                <th>Product</th>
                <th>Reviews</th>
                <th style={{ color:"var(--positive)" }}>Positive</th>
                <th style={{ color:"var(--negative)" }}>Negative</th>
                <th style={{ color:"var(--neutral)" }}>Neutral</th>
                <th>Avg Score</th>
                <th>Sentiment Bar</th>
                <th>Best Review</th>
              </tr>
            </thead>
            <tbody>
              {board.map(item => {
                const trend = item.avg_score > 0.1 ? "up" : item.avg_score < -0.1 ? "down" : "flat";
                return (
                  <tr
                    key={item.product}
                    className={styles.tableRow}
                    onClick={() => navigate(`/product/${encodeURIComponent(item.product)}`)}
                  >
                    <td>
                      <span className={styles.rankBadge}
                        style={item.rank <= 3 ? { color: RANK_STYLES[item.rank-1].color } : {}}>
                        {item.rank <= 3 ? RANK_STYLES[item.rank-1].label : `#${item.rank}`}
                      </span>
                    </td>
                    <td>
                      <div className={styles.productCell}>
                        <span>{PRODUCT_ICONS[item.product] || "📦"}</span>
                        <span className={styles.productCellName}>{item.product}</span>
                      </div>
                    </td>
                    <td className={styles.numCell}>{item.total}</td>
                    <td>
                      <span className={styles.posCell}>{item.positive} <span className={styles.pct}>({item.positive_pct}%)</span></span>
                    </td>
                    <td>
                      <span className={styles.negCell}>{item.negative} <span className={styles.pct}>({item.negative_pct}%)</span></span>
                    </td>
                    <td>
                      <span className={styles.neuCell}>{item.neutral} <span className={styles.pct}>({item.neutral_pct}%)</span></span>
                    </td>
                    <td>
                      <span className={styles.scoreCell} style={{
                        color: item.avg_score > 0.05 ? "var(--positive)" : item.avg_score < -0.05 ? "var(--negative)" : "var(--neutral)"
                      }}>
                        {trend === "up"   && <TrendingUp  size={12} style={{ marginRight:3 }} />}
                        {trend === "down" && <TrendingDown size={12} style={{ marginRight:3 }} />}
                        {trend === "flat" && <Minus        size={12} style={{ marginRight:3 }} />}
                        {item.avg_score > 0 ? "+" : ""}{item.avg_score}
                      </span>
                    </td>
                    <td>
                      <div className={styles.miniBar}>
                        <div style={{ width:`${item.positive_pct}%`, background:"var(--positive)", opacity:0.75 }} />
                        <div style={{ width:`${item.neutral_pct}%`,  background:"var(--neutral)",  opacity:0.75 }} />
                        <div style={{ width:`${item.negative_pct}%`, background:"var(--negative)", opacity:0.75 }} />
                      </div>
                    </td>
                    <td className={styles.reviewCell}>
                      <span className={styles.reviewSnippet}>
                        "{item.top_review.length > 55 ? item.top_review.slice(0,55)+"…" : item.top_review}"
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
