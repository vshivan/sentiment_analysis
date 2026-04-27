import React, { useState } from "react";
import { scrapeURL } from "../api";
import SentimentBadge from "../components/SentimentBadge";
import SentimentPieChart from "../components/SentimentPieChart";
import TrendChart from "../components/TrendChart";
import WordCloud from "../components/WordCloud";
import {
  Globe, Search, X, Download, AlertTriangle,
  CheckCircle, Info, ExternalLink, Star
} from "lucide-react";
import styles from "./ScrapePage.module.css";

// Sites that actually work reliably
const WORKING_SITES = [
  {
    name: "Sitejabber",
    icon: "⭐",
    color: "#f5a623",
    desc: "Works for any brand — 20 reviews per page",
    examples: [
      { label: "Apple", url: "https://www.sitejabber.com/reviews/apple.com" },
      { label: "Samsung", url: "https://www.sitejabber.com/reviews/samsung.com" },
      { label: "Dell", url: "https://www.sitejabber.com/reviews/dell.com" },
      { label: "Flipkart", url: "https://www.sitejabber.com/reviews/flipkart.com" },
      { label: "Amazon", url: "https://www.sitejabber.com/reviews/amazon.com" },
      { label: "Nike", url: "https://www.sitejabber.com/reviews/nike.com" },
      { label: "Zara", url: "https://www.sitejabber.com/reviews/zara.com" },
      { label: "Adidas", url: "https://www.sitejabber.com/reviews/adidas.com" },
    ],
  },
  {
    name: "Auto-Redirect",
    icon: "🔀",
    color: "#7c6ff7",
    desc: "Paste Amazon/Flipkart URL — we redirect automatically",
    examples: [
      { label: "Amazon India", url: "https://www.amazon.in/dp/B09G9HD6PD" },
      { label: "Flipkart", url: "https://www.flipkart.com/apple-iphone-15/p/itm" },
      { label: "iPhone on Amazon", url: "https://www.amazon.in/Apple-iPhone-15/dp/B0CHX3QBCH" },
    ],
  },
  {
    name: "MouthShut",
    icon: "💬",
    color: "#e74c3c",
    desc: "Indian product & brand reviews",
    examples: [
      { label: "iPhone 15", url: "https://www.mouthshut.com/product-reviews/Apple-iPhone-15-reviews-925985523" },
      { label: "Dell Laptops", url: "https://www.mouthshut.com/product-reviews/Dell-Laptops-reviews-925048498" },
    ],
  },
];

const SITE_COLORS = {
  trustpilot: "#00b67a",
  g2: "#ff492c",
  sitejabber: "#f5a623",
  amazon: "#ff9900",
  flipkart: "#2874f0",
  generic: "var(--accent)",
};

const SITE_ICONS = {
  trustpilot: "⭐", g2: "🔷", sitejabber: "🔍",
  amazon: "🛒", flipkart: "🏪", generic: "🌐",
};

export default function ScrapePage() {
  const [url,     setUrl]     = useState("");
  const [loading, setLoading] = useState(false);
  const [result,  setResult]  = useState(null);
  const [error,   setError]   = useState(null);
  const [filter,  setFilter]  = useState("All");
  const [search,  setSearch]  = useState("");
  const [step,    setStep]    = useState("idle"); // idle | fetching | parsing | analyzing | done

  const STEPS = ["Fetching page", "Parsing HTML", "Extracting reviews", "Analyzing sentiment"];

  const handleScrape = async (targetUrl = url) => {
    const u = targetUrl.trim();
    if (!u) return;
    setUrl(u);
    setLoading(true);
    setResult(null);
    setError(null);
    setFilter("All");
    setSearch("");

    // Animate steps
    let stepIdx = 0;
    setStep(STEPS[0]);
    const stepTimer = setInterval(() => {
      stepIdx = Math.min(stepIdx + 1, STEPS.length - 1);
      setStep(STEPS[stepIdx]);
    }, 1800);

    try {
      const res = await scrapeURL(u);
      clearInterval(stepTimer);
      setStep("done");
      if (!res.data.success) {
        setError(res.data.error);
        setResult(res.data);
      } else {
        setResult(res.data);
      }
    } catch {
      clearInterval(stepTimer);
      setError("Could not reach backend. Is Flask running on port 5000?");
    } finally {
      setLoading(false);
    }
  };

  const filtered = (result?.reviews || []).filter(r => {
    const mf = filter === "All" || r.sentiment === filter;
    const ms = !search || r.text.toLowerCase().includes(search.toLowerCase());
    return mf && ms;
  });

  const exportCSV = () => {
    if (!result?.reviews?.length) return;
    const rows = ["id,sentiment,score,review"];
    result.reviews.forEach(r => {
      rows.push(`${r.id + 1},${r.sentiment},${r.score},"${r.text.replace(/"/g, '""')}"`);
    });
    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `scraped_${result.site}_${Date.now()}.csv`;
    a.click();
  };

  const sc = (s) => s === "Positive" ? "var(--positive)" : s === "Negative" ? "var(--negative)" : "var(--neutral)";

  return (
    <div className={`${styles.page} fade-in`}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Live Scraper</p>
          <h1 className={styles.title}>
            <Globe size={20} style={{ marginRight: 8, opacity: 0.8 }} />
            URL Review Analyzer
          </h1>
          <p className={styles.subtitle}>
            Paste a product review URL — we fetch, parse, and analyze sentiment instantly
          </p>
        </div>
      </div>

      {/* URL input */}
      <div className={styles.inputCard}>
        <div className={styles.urlRow}>
          <div className={styles.urlBox}>
            <Globe size={15} className={styles.urlIcon} />
            <input
              type="url"
              className={styles.urlInput}
              placeholder="https://www.trustpilot.com/review/apple.com"
              value={url}
              onChange={e => { setUrl(e.target.value); setResult(null); setError(null); }}
              onKeyDown={e => e.key === "Enter" && handleScrape()}
              aria-label="Product review URL"
            />
            {url && (
              <button className={styles.clearUrl}
                onClick={() => { setUrl(""); setResult(null); setError(null); }}>
                <X size={13} />
              </button>
            )}
          </div>
          <button
            className={styles.scrapeBtn}
            onClick={() => handleScrape()}
            disabled={loading || !url.trim()}
          >
            {loading
              ? <><span className={styles.btnSpinner} /> Analyzing…</>
              : <><Search size={14} /> Analyze</>}
          </button>
        </div>

        {/* Info banner */}
        <div className={styles.infoBanner}>
          <Info size={13} style={{ flexShrink: 0, color: "var(--accent-light)" }} />
          <span>
            <strong>Best results:</strong> Use <strong>Sitejabber</strong> URLs (sitejabber.com/reviews/brand.com).
            Paste any <strong>Amazon or Flipkart</strong> URL and we auto-redirect to Sitejabber reviews for that brand.
          </span>
        </div>
      </div>

      {/* Site cards with examples */}
      {!loading && !result && (
        <div className={styles.siteGrid}>
          {WORKING_SITES.map(site => (
            <div key={site.name} className={styles.siteCard}
              style={{ "--site-color": site.color }}>
              <div className={styles.siteCardHeader}>
                <span className={styles.siteCardIcon}>{site.icon}</span>
                <div>
                  <p className={styles.siteCardName}>{site.name}</p>
                  <p className={styles.siteCardDesc}>{site.desc}</p>
                </div>
              </div>
              <div className={styles.siteExamples}>
                {site.examples.map(ex => (
                  <button
                    key={ex.url}
                    className={styles.exampleBtn}
                    onClick={() => handleScrape(ex.url)}
                  >
                    <ExternalLink size={11} />
                    {ex.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className={styles.loadingCard}>
          <div className={styles.loadingRing} />
          <div className={styles.loadingInfo}>
            <p className={styles.loadingTitle}>Analyzing reviews…</p>
            <p className={styles.loadingUrl}>{url.length > 60 ? url.slice(0, 60) + "…" : url}</p>
          </div>
          <div className={styles.loadingSteps}>
            {STEPS.map((s, i) => (
              <div key={s} className={`${styles.loadingStep} ${step === s ? styles.stepActive : ""}`}
                style={{ animationDelay: `${i * 0.3}s` }}>
                <span className={styles.stepDot} />
                {s}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className={styles.errorCard}>
          <div className={styles.errorIcon}><AlertTriangle size={20} /></div>
          <div className={styles.errorBody}>
            <p className={styles.errorTitle}>Could not extract reviews</p>
            <p className={styles.errorMsg}>{error}</p>
            {result?.site && (
              <p className={styles.errorSite}>
                Detected: <strong>{SITE_ICONS[result.site]} {result.site}</strong>
                {result.product_name && <> · <strong>{result.product_name}</strong></>}
              </p>
            )}
            <div className={styles.errorTips}>
              <p className={styles.tipsTitle}>💡 Try these instead:</p>
              <div className={styles.tipsBtns}>
                {WORKING_SITES[0].examples.slice(0, 3).map(ex => (
                  <button key={ex.url} className={styles.tipBtn}
                    onClick={() => handleScrape(ex.url)}>
                    ⭐ {ex.label} on Trustpilot
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {!loading && result?.success && (
        <div className={`${styles.results} fade-in-up`}>
          {/* Redirect notice */}
          {result.redirected && (
            <div className={styles.redirectNotice}>
              <span>🔀</span>
              <span>
                Redirected to <strong>Sitejabber</strong> for better results ·{" "}
                <a href={result.url} target="_blank" rel="noopener noreferrer" className={styles.redirectLink}>
                  {result.url}
                </a>
              </span>
            </div>
          )}
          {/* Product banner */}
          <div className={styles.productBanner}
            style={{ borderLeftColor: SITE_COLORS[result.site] || "var(--accent)" }}>
            <div className={styles.bannerLeft}>
              <span className={styles.bannerSiteIcon}>{SITE_ICONS[result.site] || "🌐"}</span>
              <div>
                <div className={styles.bannerMeta}>
                  <span className={styles.bannerSite}
                    style={{ color: SITE_COLORS[result.site] }}>
                    {result.site.charAt(0).toUpperCase() + result.site.slice(1)}
                  </span>
                  <span className={styles.bannerDot}>·</span>
                  <a href={result.url} target="_blank" rel="noopener noreferrer"
                    className={styles.bannerUrl}>
                    {result.url.length > 55 ? result.url.slice(0, 55) + "…" : result.url}
                    <ExternalLink size={11} style={{ marginLeft: 4 }} />
                  </a>
                </div>
                <h2 className={styles.bannerName}>{result.product_name}</h2>
              </div>
            </div>
            <div className={styles.bannerRight}>
              <span className={styles.foundBadge}>
                <CheckCircle size={12} /> {result.count} reviews
              </span>
              <button className={styles.exportBtn} onClick={exportCSV}>
                <Download size={13} /> CSV
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className={styles.statsRow}>
            {[
              { label: "Positive", val: result.stats.Positive, pct: result.stats.positive_pct, color: "var(--positive)" },
              { label: "Negative", val: result.stats.Negative, pct: result.stats.negative_pct, color: "var(--negative)" },
              { label: "Neutral",  val: result.stats.Neutral,  pct: result.stats.neutral_pct,  color: "var(--neutral)" },
              { label: "Avg Score", val: (result.stats.avg_score > 0 ? "+" : "") + result.stats.avg_score, pct: null, color: "var(--accent-light)" },
            ].map(s => (
              <div key={s.label} className={styles.statCard}
                style={{ borderTopColor: s.color }}>
                <span className={styles.statVal} style={{ color: s.color }}>{s.val}</span>
                <span className={styles.statLabel}>{s.label}</span>
                {s.pct !== null && <span className={styles.statPct} style={{ color: s.color }}>{s.pct}%</span>}
              </div>
            ))}
          </div>

          {/* Charts */}
          <div className={styles.chartsRow}>
            <div className={styles.chartCard}>
              <p className={styles.chartTitle}>Sentiment Distribution</p>
              <SentimentPieChart stats={result.stats} />
            </div>
            <div className={styles.chartCard}>
              <p className={styles.chartTitle}>Sentiment Trend</p>
              <TrendChart reviews={result.reviews} />
            </div>
            <div className={styles.chartCard}>
              <p className={styles.chartTitle}>Top Keywords</p>
              {result.keywords?.length > 0
                ? <WordCloud words={result.keywords} />
                : <p className={styles.empty}>No keywords extracted.</p>}
            </div>
          </div>

          {/* Reviews */}
          <div className={styles.reviewsCard}>
            <div className={styles.reviewsTop}>
              <div className={styles.reviewsTopLeft}>
                <p className={styles.chartTitle}>All Reviews</p>
                <span className={styles.reviewCount}>{filtered.length} / {result.reviews.length}</span>
              </div>
              <div className={styles.reviewControls}>
                <div className={styles.searchBox}>
                  <Search size={12} className={styles.searchIcon} />
                  <input type="text" placeholder="Search…" value={search}
                    onChange={e => setSearch(e.target.value)}
                    className={styles.searchInput} />
                </div>
                <div className={styles.filterTabs}>
                  {["All", "Positive", "Negative", "Neutral"].map(f => (
                    <button key={f}
                      className={`${styles.filterTab} ${filter === f ? styles.activeTab : ""}`}
                      onClick={() => setFilter(f)}>{f}</button>
                  ))}
                </div>
              </div>
            </div>

            {filtered.length === 0
              ? <p className={styles.empty}>No reviews match your filter.</p>
              : (
                <div className={styles.reviewsList}>
                  {filtered.map(r => (
                    <div key={r.id} className={styles.reviewCard}>
                      <div className={styles.reviewTop}>
                        <span className={styles.reviewNum}>#{r.id + 1}</span>
                        <SentimentBadge sentiment={r.sentiment} />
                        <span className={styles.reviewScore} style={{ color: sc(r.sentiment) }}>
                          {r.score > 0 ? "+" : ""}{r.score}
                        </span>
                      </div>
                      <p className={styles.reviewText}>{r.text}</p>
                    </div>
                  ))}
                </div>
              )}
          </div>
        </div>
      )}
    </div>
  );
}
