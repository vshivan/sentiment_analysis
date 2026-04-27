import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchReviews, fetchKeywords, exportURL } from "../api";
import SentimentBadge from "../components/SentimentBadge";
import SentimentPieChart from "../components/SentimentPieChart";
import TrendChart from "../components/TrendChart";
import WordCloud from "../components/WordCloud";
import Spinner from "../components/Spinner";
import { ArrowLeft, Search, Download, SlidersHorizontal, X } from "lucide-react";
import styles from "./ProductPage.module.css";

const PRODUCT_ICONS = {
  Adidas: "👟", Zara: "👗", Dell: "💻", Supra: "👠",
  iPhone: "📱", Lenskart: "👓", "Lloyd AC": "❄️", "Titan Watch": "⌚"
};

export default function ProductPage() {
  const { name } = useParams();
  const product   = decodeURIComponent(name);
  const navigate  = useNavigate();

  const [reviews,  setReviews]  = useState([]);
  const [keywords, setKeywords] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [search,   setSearch]   = useState("");
  const [filter,   setFilter]   = useState("All");
  const [sortBy,   setSortBy]   = useState("default");   // default | score-asc | score-desc
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    setLoading(true);
    setSearch("");
    setFilter("All");
    setSortBy("default");

    Promise.all([fetchReviews(product), fetchKeywords(product)])
      .then(([rRes, kRes]) => {
        setReviews(rRes.data.reviews);
        setKeywords(kRes.data.keywords);
      })
      .catch(() => setError("Could not load product data."))
      .finally(() => setLoading(false));
  }, [product]);

  // Sentiment stats derived from reviews
  const stats = useMemo(() => {
    const s = { Positive: 0, Negative: 0, Neutral: 0 };
    reviews.forEach(r => s[r.sentiment]++);
    return s;
  }, [reviews]);

  // Filtered + sorted reviews
  const filtered = useMemo(() => {
    // Multi-keyword search: space-separated terms all must match
    const terms = search.trim().toLowerCase().split(/\s+/).filter(Boolean);

    let result = reviews.filter(r => {
      const matchFilter = filter === "All" || r.sentiment === filter;
      const matchSearch = terms.length === 0 ||
        terms.every(t => r.text.toLowerCase().includes(t));
      return matchFilter && matchSearch;
    });

    if (sortBy === "score-desc") result = [...result].sort((a, b) => b.score - a.score);
    if (sortBy === "score-asc")  result = [...result].sort((a, b) => a.score - b.score);

    return result;
  }, [reviews, filter, search, sortBy]);

  const activeFilterCount = [
    filter !== "All",
    sortBy !== "default",
    search.trim() !== ""
  ].filter(Boolean).length;

  const clearFilters = () => { setFilter("All"); setSortBy("default"); setSearch(""); };

  if (loading) return <Spinner label={`Loading ${product}…`} />;
  if (error)   return <div className={styles.error}>{error}</div>;

  const avgScore = reviews.length
    ? (reviews.reduce((a, r) => a + r.score, 0) / reviews.length).toFixed(3)
    : 0;

  return (
    <div className={`${styles.page} fade-in`}>
      {/* Header */}
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate("/dashboard")}>
          <ArrowLeft size={16} /> Back
        </button>
        <div className={styles.titleRow}>
          <span className={styles.emoji}>{PRODUCT_ICONS[product] || "📦"}</span>
          <div>
            <h1 className={styles.title}>{product}</h1>
            <p className={styles.subtitle}>{reviews.length} reviews · Avg score: {avgScore}</p>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className={styles.statsRow}>
        {["Positive", "Negative", "Neutral"].map(s => {
          const pct = reviews.length ? ((stats[s] / reviews.length) * 100).toFixed(0) : 0;
          const color = { Positive: "var(--positive)", Negative: "var(--negative)", Neutral: "var(--neutral)" }[s];
          return (
            <div key={s} className={styles.statPill} style={{ borderColor: color }}>
              <span className={styles.statCount} style={{ color }}>{stats[s]}</span>
              <span className={styles.statLabel}>{s}</span>
              <span className={styles.statPct} style={{ color }}>{pct}%</span>
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <div className={styles.chartsRow}>
        <div className={styles.chartCard}>
          <h2 className={styles.cardTitle}>Sentiment Distribution</h2>
          <SentimentPieChart stats={stats} />
        </div>
        <div className={styles.chartCard}>
          <h2 className={styles.cardTitle}>Sentiment Trend</h2>
          <TrendChart reviews={reviews} />
        </div>
        <div className={styles.chartCard}>
          <h2 className={styles.cardTitle}>Keyword Cloud</h2>
          {keywords.length > 0
            ? <WordCloud words={keywords} />
            : <p className={styles.empty}>No keywords found.</p>
          }
        </div>
      </div>

      {/* Reviews list */}
      <div className={styles.reviewsSection}>
        <div className={styles.reviewsHeader}>
          <div className={styles.reviewsHeaderLeft}>
            <h2 className={styles.cardTitle}>All Reviews</h2>
            <span className={styles.reviewCount}>{filtered.length} of {reviews.length}</span>
          </div>

          <div className={styles.controls}>
            {/* Multi-keyword search */}
            <div className={styles.searchBox}>
              <Search size={13} className={styles.searchIcon} />
              <input
                type="text"
                placeholder="Search keywords…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className={styles.searchInput}
                aria-label="Search reviews"
              />
              {search && (
                <button className={styles.clearSearch} onClick={() => setSearch("")} aria-label="Clear search">
                  <X size={11} />
                </button>
              )}
            </div>

            {/* Filter toggle */}
            <button
              className={`${styles.filterToggle} ${showFilters ? styles.filterToggleActive : ""}`}
              onClick={() => setShowFilters(v => !v)}
              aria-label="Toggle filters"
            >
              <SlidersHorizontal size={13} />
              Filters
              {activeFilterCount > 0 && (
                <span className={styles.filterBadge}>{activeFilterCount}</span>
              )}
            </button>

            {/* Export dropdown */}
            <div className={styles.exportGroup}>
              <span className={styles.exportLabel}>Export</span>
              <a
                href={exportURL(product, "csv")}
                className={styles.exportBtn}
                download
                title="Download CSV"
              >CSV</a>
              <a
                href={exportURL(product, "json")}
                className={styles.exportBtn}
                download
                title="Download JSON"
              >JSON</a>
            </div>
          </div>
        </div>

        {/* Expanded filter panel */}
        {showFilters && (
          <div className={styles.filterPanel}>
            <div className={styles.filterGroup}>
              <span className={styles.filterGroupLabel}>Sentiment</span>
              <div className={styles.filterTabs} role="group">
                {["All", "Positive", "Negative", "Neutral"].map(f => (
                  <button
                    key={f}
                    className={`${styles.filterTab} ${filter === f ? styles.activeTab : ""}`}
                    onClick={() => setFilter(f)}
                    aria-pressed={filter === f}
                  >{f}</button>
                ))}
              </div>
            </div>

            <div className={styles.filterGroup}>
              <span className={styles.filterGroupLabel}>Sort by Score</span>
              <div className={styles.filterTabs} role="group">
                {[
                  { val: "default",    label: "Default" },
                  { val: "score-desc", label: "Highest first" },
                  { val: "score-asc",  label: "Lowest first" },
                ].map(o => (
                  <button
                    key={o.val}
                    className={`${styles.filterTab} ${sortBy === o.val ? styles.activeTab : ""}`}
                    onClick={() => setSortBy(o.val)}
                    aria-pressed={sortBy === o.val}
                  >{o.label}</button>
                ))}
              </div>
            </div>

            {activeFilterCount > 0 && (
              <button className={styles.clearBtn} onClick={clearFilters}>
                <X size={12} /> Clear all
              </button>
            )}
          </div>
        )}

        {filtered.length === 0 ? (
          <p className={styles.empty}>No reviews match your filter.</p>
        ) : (
          <div className={styles.reviewsList}>
            {filtered.map(r => (
              <div key={r.id} className={styles.reviewCard}>
                <div className={styles.reviewTop}>
                  <span className={styles.reviewNum}>#{r.id + 1}</span>
                  <SentimentBadge sentiment={r.sentiment} />
                  <span className={styles.scoreChip}>
                    Score: <strong style={{
                      color: r.score > 0.05 ? "var(--positive)" : r.score < -0.05 ? "var(--negative)" : "var(--neutral)"
                    }}>{r.score}</strong>
                  </span>
                </div>
                {/* Highlight search terms */}
                <p className={styles.reviewText}>
                  <HighlightText text={r.text} terms={search.trim().toLowerCase().split(/\s+/).filter(Boolean)} />
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/** Highlights all search terms in a review text */
function HighlightText({ text, terms }) {
  if (!terms.length) return text;
  const regex = new RegExp(`(${terms.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "gi");
  const parts = text.split(regex);
  return parts.map((part, i) =>
    regex.test(part)
      ? <mark key={i} style={{ background: "rgba(184,154,78,0.25)", color: "var(--neutral)", borderRadius: 3, padding: "0 2px" }}>{part}</mark>
      : part
  );
}
