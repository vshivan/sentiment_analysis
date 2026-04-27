import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { globalSearch } from "../api";
import SentimentBadge from "../components/SentimentBadge";
import Spinner from "../components/Spinner";
import { Search, ArrowRight } from "lucide-react";
import styles from "./SearchPage.module.css";

export default function SearchPage() {
  const [query,   setQuery]   = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [page,    setPage]    = useState(1);
  const [pagination, setPagination] = useState(null);
  const navigate = useNavigate();

  const doSearch = useCallback(async (q = query, p = 1) => {
    if (q.trim().length < 2) return;
    setLoading(true);
    try {
      const res = await globalSearch(q.trim(), p);
      setResults(res.data.reviews);
      setPagination(res.data.pagination);
      setPage(p);
    } catch { setResults([]); }
    finally { setLoading(false); }
  }, [query]);

  const handleKey = (e) => { if (e.key === "Enter") doSearch(); };

  const highlight = (text, q) => {
    if (!q.trim()) return text;
    const regex = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
    const parts = text.split(regex);
    return parts.map((p, i) =>
      regex.test(p)
        ? <mark key={i} style={{ background:"rgba(0,212,255,0.2)", color:"var(--cyan)", borderRadius:3, padding:"0 2px" }}>{p}</mark>
        : p
    );
  };

  return (
    <div className={`${styles.page} fade-in`}>
      <div className={styles.header}>
        <p className={styles.eyebrow}>Search</p>
        <h1 className={styles.title}><Search size={20} style={{marginRight:8,opacity:0.8}}/>Global Search</h1>
        <p className={styles.subtitle}>Search across all reviews from all products</p>
      </div>

      <div className={styles.searchCard}>
        <div className={styles.searchRow}>
          <div className={styles.searchBox}>
            <Search size={16} className={styles.searchIcon}/>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search reviews across all products…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleKey}
              autoFocus
            />
          </div>
          <button className="btn-primary" onClick={() => doSearch()} disabled={loading || query.trim().length < 2}>
            {loading ? <><span className={styles.spin}/>Searching…</> : "Search"}
          </button>
        </div>
      </div>

      {loading && <Spinner label="Searching…"/>}

      {!loading && results !== null && (
        <div className={styles.results}>
          <div className={styles.resultsHeader}>
            <span className={styles.resultCount}>
              {pagination?.total || 0} results for "<strong>{query}</strong>"
            </span>
          </div>

          {results.length === 0
            ? <div className={styles.empty}><Search size={32} style={{opacity:0.2}}/><p>No reviews found for "{query}"</p></div>
            : (
              <>
                <div className={styles.resultsList}>
                  {results.map(r => (
                    <div key={r.id} className={styles.resultCard}>
                      <div className={styles.resultTop}>
                        <button className={styles.productLink}
                          onClick={() => navigate(`/product/${encodeURIComponent(r.product_name)}`)}>
                          {r.product_name} <ArrowRight size={12}/>
                        </button>
                        <SentimentBadge sentiment={r.sentiment}/>
                        <span className={styles.score} style={{
                          color: r.score > 0.05 ? "var(--positive)" : r.score < -0.05 ? "var(--negative)" : "var(--neutral)"
                        }}>{r.score > 0 ? "+" : ""}{r.score}</span>
                        <span className={styles.date}>{new Date(r.created_at).toLocaleDateString()}</span>
                      </div>
                      <p className={styles.resultText}>{highlight(r.text, query)}</p>
                      <div className={styles.resultMeta}>
                        <span className={styles.metaTag}>{r.language}</span>
                        <span className={styles.metaTag}>{r.source}</span>
                        {r.tags && r.tags.split(",").filter(Boolean).map(t => (
                          <span key={t} className={styles.metaTag}>{t.trim()}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {pagination && pagination.pages > 1 && (
                  <div className={styles.pagination}>
                    <button className="btn-ghost" disabled={!pagination.has_prev}
                      onClick={() => doSearch(query, page - 1)}>← Prev</button>
                    <span className={styles.pageInfo}>Page {pagination.page} of {pagination.pages}</span>
                    <button className="btn-ghost" disabled={!pagination.has_next}
                      onClick={() => doSearch(query, page + 1)}>Next →</button>
                  </div>
                )}
              </>
            )
          }
        </div>
      )}
    </div>
  );
}
