import React, { useState } from "react";
import { analyzeText } from "../api";
import SentimentBadge from "../components/SentimentBadge";
import { Zap, RotateCcw } from "lucide-react";
import styles from "./AnalyzePage.module.css";

// Sample prompts to help users try the analyzer
const SAMPLES = [
  "The product quality is amazing and totally worth the price!",
  "Bahut bekar product hai, bilkul waste of money.",
  "It's okay, nothing special but gets the job done.",
  "Camera quality is outstanding, best in class.",
  "Delivery was late and packaging was damaged.",
  "Achha product hai, mujhe pasand aaya.",
];

export default function AnalyzePage() {
  const [text,      setText]      = useState("");
  const [result,    setResult]    = useState(null);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState(null);
  const [history,   setHistory]   = useState([]);

  const handleAnalyze = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await analyzeText(text.trim());
      const data = res.data;
      setResult(data);
      // Prepend to history (keep last 10)
      setHistory(prev => [data, ...prev].slice(0, 10));
    } catch {
      setError("Analysis failed. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleAnalyze();
  };

  const handleSample = (s) => {
    setText(s);
    setResult(null);
  };

  const handleReset = () => {
    setText("");
    setResult(null);
    setError(null);
  };

  // Score bar width (0–100%)
  const scoreBarWidth = result
    ? `${Math.round(((result.score + 1) / 2) * 100)}%`
    : "50%";

  const scoreColor = result
    ? result.score > 0.05 ? "var(--positive)"
    : result.score < -0.05 ? "var(--negative)"
    : "var(--neutral)"
    : "var(--accent)";

  return (
    <div className={`${styles.page} fade-in`}>
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.title}><Zap size={22} style={{ verticalAlign: "middle", marginRight: 8 }} />Analyze Text</h1>
        <p className={styles.subtitle}>Paste any review or text to instantly detect its sentiment</p>
      </div>

      <div className={styles.body}>
        {/* Input panel */}
        <div className={styles.inputPanel}>
          <div className={styles.textareaWrap}>
            <textarea
              className={styles.textarea}
              placeholder="Type or paste a review here… (Ctrl+Enter to analyze)"
              value={text}
              onChange={e => { setText(e.target.value); setResult(null); }}
              onKeyDown={handleKeyDown}
              rows={6}
              aria-label="Review text input"
            />
            <span className={styles.charCount}>{text.length} chars</span>
          </div>

          <div className={styles.actions}>
            <button
              className={styles.analyzeBtn}
              onClick={handleAnalyze}
              disabled={loading || !text.trim()}
              aria-label="Analyze sentiment"
            >
              {loading
                ? <><span className={styles.btnSpinner} /> Analyzing…</>
                : <><Zap size={15} /> Analyze</>
              }
            </button>
            <button className={styles.resetBtn} onClick={handleReset} aria-label="Clear input">
              <RotateCcw size={14} /> Clear
            </button>
          </div>

          {/* Sample prompts */}
          <div className={styles.samples}>
            <p className={styles.samplesLabel}>Try a sample:</p>
            <div className={styles.sampleChips}>
              {SAMPLES.map((s, i) => (
                <button key={i} className={styles.sampleChip} onClick={() => handleSample(s)}>
                  {s.length > 40 ? s.slice(0, 40) + "…" : s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Result panel */}
        <div className={styles.resultPanel}>
          {error && <div className={styles.errorBox}>{error}</div>}

          {!result && !error && (
            <div className={styles.placeholder}>
              <span style={{ fontSize: "3.5rem" }}>🔍</span>
              <p>Your sentiment result will appear here</p>
              <p className={styles.hint}>Supports English + Hindi/Hinglish</p>
            </div>
          )}

          {result && (
            <div className={`${styles.resultCard} fade-in`}>
              <div className={styles.resultTop}>
                <SentimentBadge sentiment={result.sentiment} />
                <span className={styles.scoreLabel}>Polarity Score</span>
              </div>

              {/* Score gauge */}
              <div className={styles.gauge}>
                <div className={styles.gaugeTrack}>
                  <div
                    className={styles.gaugeFill}
                    style={{ width: scoreBarWidth, background: scoreColor }}
                  />
                  <div className={styles.gaugeCenter} />
                </div>
                <div className={styles.gaugeLabels}>
                  <span style={{ color: "var(--negative)" }}>Negative</span>
                  <span style={{ color: "var(--neutral)" }}>Neutral</span>
                  <span style={{ color: "var(--positive)" }}>Positive</span>
                </div>
              </div>

              <div className={styles.scoreValue} style={{ color: scoreColor }}>
                {result.score > 0 ? "+" : ""}{result.score}
              </div>

              <div className={styles.analyzedText}>
                <p className={styles.analyzedLabel}>Analyzed text:</p>
                <p className={styles.analyzedContent}>"{result.text}"</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* History */}
      {history.length > 0 && (
        <div className={styles.historySection}>
          <h2 className={styles.historyTitle}>Recent Analyses</h2>
          <div className={styles.historyList}>
            {history.map((h, i) => (
              <div key={i} className={styles.historyItem}>
                <SentimentBadge sentiment={h.sentiment} />
                <p className={styles.historyText}>{h.text}</p>
                <span className={styles.historyScore} style={{
                  color: h.score > 0.05 ? "var(--positive)" : h.score < -0.05 ? "var(--negative)" : "var(--neutral)"
                }}>
                  {h.score > 0 ? "+" : ""}{h.score}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
