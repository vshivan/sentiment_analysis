import React, { useEffect, useState } from "react";
import { fetchStats, fetchReviews, addReview, deleteReview } from "../api";
import SentimentBadge from "../components/SentimentBadge";
import Spinner from "../components/Spinner";
import { Trash2, PlusCircle, RefreshCw } from "lucide-react";
import styles from "./AdminPanel.module.css";

const PRODUCT_ICONS = {
  Adidas: "👟", Zara: "👗", Dell: "💻", Supra: "👠",
  iPhone: "📱", Lenskart: "👓", "Lloyd AC": "❄️", "Titan Watch": "⌚"
};

export default function AdminPanel() {
  const [stats,       setStats]       = useState(null);
  const [products,    setProducts]    = useState([]);
  const [selected,    setSelected]    = useState(null);
  const [reviews,     setReviews]     = useState([]);
  const [newText,     setNewText]     = useState("");
  const [loadingMain, setLoadingMain] = useState(true);
  const [loadingRev,  setLoadingRev]  = useState(false);
  const [submitting,  setSubmitting]  = useState(false);
  const [toast,       setToast]       = useState(null);

  // Load global stats
  const loadStats = () => {
    setLoadingMain(true);
    fetchStats()
      .then(r => {
        setStats(r.data);
        setProducts(Object.keys(r.data.product_stats));
      })
      .finally(() => setLoadingMain(false));
  };

  useEffect(() => { loadStats(); }, []);

  // Load reviews for selected product
  const loadReviews = (product) => {
    setSelected(product);
    setLoadingRev(true);
    fetchReviews(product)
      .then(r => setReviews(r.data.reviews))
      .finally(() => setLoadingRev(false));
  };

  // Show toast notification
  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Add review
  const handleAdd = async () => {
    if (!newText.trim() || !selected) return;
    setSubmitting(true);
    try {
      await addReview(selected, newText.trim());
      setNewText("");
      await loadReviews(selected);
      loadStats();
      showToast("Review added successfully!");
    } catch {
      showToast("Failed to add review.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Delete review
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this review?")) return;
    try {
      await deleteReview(selected, id);
      setReviews(prev => prev.filter(r => r.id !== id));
      loadStats();
      showToast("Review deleted.");
    } catch {
      showToast("Failed to delete review.", "error");
    }
  };

  if (loadingMain) return <Spinner label="Loading admin panel…" />;

  const { total_reviews, overall_sentiment, product_stats } = stats;

  return (
    <div className={`${styles.page} fade-in`}>
      {/* Toast */}
      {toast && (
        <div className={`${styles.toast} ${toast.type === "error" ? styles.toastError : styles.toastSuccess}`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Management</p>
          <h1 className={styles.title}>Admin Panel</h1>
          <p className={styles.subtitle}>Manage reviews and monitor sentiment health</p>
        </div>
        <button className={styles.refreshBtn} onClick={loadStats} aria-label="Refresh stats">
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      {/* Global stats */}
      <div className={styles.globalStats}>
        <div className={styles.globalCard}>
          <span className={styles.globalNum}>{total_reviews}</span>
          <span className={styles.globalLabel}>Total Reviews</span>
        </div>
        <div className={styles.globalCard} style={{ borderColor: "var(--positive)" }}>
          <span className={styles.globalNum} style={{ color: "var(--positive)" }}>{overall_sentiment.Positive}</span>
          <span className={styles.globalLabel}>Positive</span>
        </div>
        <div className={styles.globalCard} style={{ borderColor: "var(--negative)" }}>
          <span className={styles.globalNum} style={{ color: "var(--negative)" }}>{overall_sentiment.Negative}</span>
          <span className={styles.globalLabel}>Negative</span>
        </div>
        <div className={styles.globalCard} style={{ borderColor: "var(--neutral)" }}>
          <span className={styles.globalNum} style={{ color: "var(--neutral)" }}>{overall_sentiment.Neutral}</span>
          <span className={styles.globalLabel}>Neutral</span>
        </div>
      </div>

      <div className={styles.body}>
        {/* Product list */}
        <div className={styles.productList}>
          <h2 className={styles.sectionTitle}>Products</h2>
          {products.map(p => {
            const s = product_stats[p];
            return (
              <button
                key={p}
                className={`${styles.productItem} ${selected === p ? styles.selectedProduct : ""}`}
                onClick={() => loadReviews(p)}
              >
                <span className={styles.pIcon}>{PRODUCT_ICONS[p] || "📦"}</span>
                <div className={styles.pInfo}>
                  <span className={styles.pName}>{p}</span>
                  <span className={styles.pMeta}>{s.total} reviews</span>
                </div>
                <div className={styles.pBars}>
                  <span style={{ color: "var(--positive)", fontSize: "0.7rem" }}>+{s.Positive}</span>
                  <span style={{ color: "var(--negative)", fontSize: "0.7rem" }}>−{s.Negative}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Review manager */}
        <div className={styles.reviewManager}>
          {!selected ? (
            <div className={styles.placeholder}>
              <span style={{ fontSize: "3rem" }}>👈</span>
              <p>Select a product to manage its reviews</p>
            </div>
          ) : (
            <>
              <div className={styles.managerHeader}>
                <h2 className={styles.sectionTitle}>
                  {PRODUCT_ICONS[selected]} {selected} — Reviews
                </h2>
                <span className={styles.countBadge}>{reviews.length} total</span>
              </div>

              {/* Add review */}
              <div className={styles.addBox}>
                <textarea
                  className={styles.addInput}
                  placeholder="Write a new review…"
                  value={newText}
                  onChange={e => setNewText(e.target.value)}
                  rows={3}
                  aria-label="New review text"
                />
                <button
                  className={styles.addBtn}
                  onClick={handleAdd}
                  disabled={submitting || !newText.trim()}
                  aria-label="Add review"
                >
                  <PlusCircle size={16} />
                  {submitting ? "Adding…" : "Add Review"}
                </button>
              </div>

              {/* Reviews */}
              {loadingRev ? (
                <Spinner label="Loading reviews…" />
              ) : (
                <div className={styles.reviewsList}>
                  {reviews.map(r => (
                    <div key={r.id} className={styles.reviewRow}>
                      <div className={styles.reviewContent}>
                        <div className={styles.reviewMeta}>
                          <SentimentBadge sentiment={r.sentiment} />
                          <span className={styles.scoreText}>
                            Score: <strong style={{
                              color: r.score > 0.05 ? "var(--positive)" : r.score < -0.05 ? "var(--negative)" : "var(--neutral)"
                            }}>{r.score}</strong>
                          </span>
                        </div>
                        <p className={styles.reviewText}>{r.text}</p>
                      </div>
                      <button
                        className={styles.deleteBtn}
                        onClick={() => handleDelete(r.id)}
                        aria-label={`Delete review ${r.id + 1}`}
                        title="Delete review"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
