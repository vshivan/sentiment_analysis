import React, { useEffect, useState } from "react";
import { fetchProducts, fetchComparison } from "../api";
import SentimentBadge from "../components/SentimentBadge";
import SentimentPieChart from "../components/SentimentPieChart";
import Spinner from "../components/Spinner";
import { GitCompareArrows, X, Plus } from "lucide-react";
import styles from "./ComparePage.module.css";

const PRODUCT_ICONS = {
  Adidas: "👟", Zara: "👗", Dell: "💻", Supra: "👠",
  iPhone: "📱", Lenskart: "👓", "Lloyd AC": "❄️", "Titan Watch": "⌚"
};

export default function ComparePage() {
  const [allProducts, setAllProducts] = useState([]);
  const [selected,    setSelected]    = useState([]);
  const [result,      setResult]      = useState(null);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState(null);

  useEffect(() => {
    fetchProducts().then(r => setAllProducts(r.data.products));
  }, []);

  const toggleProduct = (p) => {
    setSelected(prev =>
      prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]
    );
    setResult(null);
  };

  const handleCompare = async () => {
    if (selected.length < 2) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetchComparison(selected);
      setResult(res.data.comparison);
    } catch {
      setError("Comparison failed. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  // Score bar width helper
  const pct = (val, total) => total ? Math.round((val / total) * 100) : 0;

  return (
    <div className={`${styles.page} fade-in`}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>
            <GitCompareArrows size={20} style={{ verticalAlign: "middle", marginRight: 8, opacity: 0.7 }} />
            Compare Products
          </h1>
          <p className={styles.subtitle}>Select 2–4 products to compare sentiment side-by-side</p>
        </div>
      </div>

      {/* Product selector */}
      <div className={styles.selectorCard}>
        <p className={styles.selectorLabel}>Choose products to compare</p>
        <div className={styles.productChips}>
          {allProducts.map(p => (
            <button
              key={p}
              className={`${styles.chip} ${selected.includes(p) ? styles.chipActive : ""}`}
              onClick={() => toggleProduct(p)}
              disabled={!selected.includes(p) && selected.length >= 4}
              aria-pressed={selected.includes(p)}
            >
              <span>{PRODUCT_ICONS[p] || "📦"}</span>
              {p}
              {selected.includes(p) && <X size={12} className={styles.chipX} />}
            </button>
          ))}
        </div>

        <div className={styles.selectorFooter}>
          <span className={styles.selCount}>
            {selected.length} selected {selected.length < 2 && "— pick at least 2"}
          </span>
          <button
            className={styles.compareBtn}
            onClick={handleCompare}
            disabled={selected.length < 2 || loading}
          >
            {loading ? "Comparing…" : "Compare →"}
          </button>
        </div>
      </div>

      {error && <div className={styles.errorBox}>{error}</div>}
      {loading && <Spinner label="Comparing products…" />}

      {/* Results */}
      {result && !loading && (
        <div className={styles.results}>
          {/* Summary table */}
          <div className={styles.summaryCard}>
            <h2 className={styles.sectionTitle}>Summary</h2>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Reviews</th>
                    <th style={{ color: "var(--positive)" }}>Positive</th>
                    <th style={{ color: "var(--negative)" }}>Negative</th>
                    <th style={{ color: "var(--neutral)" }}>Neutral</th>
                    <th>Avg Score</th>
                    <th>Sentiment Bar</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(result).map(([product, data]) => {
                    const s = data.stats;
                    const winner = s.positive_pct >= 60;
                    return (
                      <tr key={product} className={winner ? styles.winnerRow : ""}>
                        <td className={styles.productCell}>
                          <span>{PRODUCT_ICONS[product] || "📦"}</span>
                          <span>{product}</span>
                          {winner && <span className={styles.winnerTag}>Top</span>}
                        </td>
                        <td>{s.total}</td>
                        <td style={{ color: "var(--positive)", fontWeight: 600 }}>
                          {s.Positive} <span className={styles.pctText}>({s.positive_pct}%)</span>
                        </td>
                        <td style={{ color: "var(--negative)", fontWeight: 600 }}>
                          {s.Negative} <span className={styles.pctText}>({s.negative_pct}%)</span>
                        </td>
                        <td style={{ color: "var(--neutral)", fontWeight: 600 }}>
                          {s.Neutral} <span className={styles.pctText}>({s.neutral_pct}%)</span>
                        </td>
                        <td style={{
                          fontWeight: 700,
                          color: s.avg_score > 0.05 ? "var(--positive)" : s.avg_score < -0.05 ? "var(--negative)" : "var(--neutral)"
                        }}>
                          {s.avg_score > 0 ? "+" : ""}{s.avg_score}
                        </td>
                        <td>
                          <div className={styles.miniBar}>
                            <div style={{ width: `${s.positive_pct}%`, background: "var(--positive)", opacity: 0.75 }} />
                            <div style={{ width: `${s.neutral_pct}%`,  background: "var(--neutral)",  opacity: 0.75 }} />
                            <div style={{ width: `${s.negative_pct}%`, background: "var(--negative)", opacity: 0.75 }} />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Per-product detail columns */}
          <div
            className={styles.detailGrid}
            style={{ gridTemplateColumns: `repeat(${Object.keys(result).length}, 1fr)` }}
          >
            {Object.entries(result).map(([product, data]) => (
              <div key={product} className={styles.detailCard}>
                {/* Card header */}
                <div className={styles.detailHeader}>
                  <span className={styles.detailEmoji}>{PRODUCT_ICONS[product] || "📦"}</span>
                  <div>
                    <p className={styles.detailName}>{product}</p>
                    <p className={styles.detailMeta}>{data.stats.total} reviews</p>
                  </div>
                </div>

                {/* Pie chart */}
                <SentimentPieChart stats={data.stats} />

                {/* Top keywords */}
                <div className={styles.keywordsSection}>
                  <p className={styles.kwLabel}>Top Keywords</p>
                  <div className={styles.kwChips}>
                    {data.keywords.slice(0, 10).map(k => (
                      <span key={k.text} className={styles.kwChip}>{k.text}</span>
                    ))}
                  </div>
                </div>

                {/* Reviews */}
                <div className={styles.reviewsSection}>
                  <p className={styles.kwLabel}>Reviews</p>
                  {data.reviews.map(r => (
                    <div key={r.id} className={styles.reviewRow}>
                      <SentimentBadge sentiment={r.sentiment} />
                      <p className={styles.reviewText}>{r.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
