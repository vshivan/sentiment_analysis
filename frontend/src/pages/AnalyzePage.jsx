import React, { useRef, useState } from "react";
import { analyzeText, analyzeImage } from "../api";
import SentimentBadge from "../components/SentimentBadge";
import { Zap, RotateCcw, Upload, Info, ChevronDown, ChevronUp, ThumbsUp, ThumbsDown, Lightbulb, ArrowRight } from "lucide-react";
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

// Sentiment emoji map
const SENTIMENT_EMOJI = { Positive: "😊", Negative: "😞", Neutral: "😐" };

export default function AnalyzePage() {
  const [text,         setText]         = useState("");
  const [result,       setResult]       = useState(null);
  const [imageFile,    setImageFile]    = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageResult,  setImageResult]  = useState(null);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState(null);
  const [history,      setHistory]      = useState([]);
  const [showFactors,  setShowFactors]  = useState(true);
  const fileRef = useRef();

  const handleAnalyze = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await analyzeText(text.trim());
      const data = { ...res.data, analysis_type: "text" };
      setResult(data);
      setImageResult(null);
      setShowFactors(true);
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

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose a valid image file.");
      return;
    }
    setError(null);
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setImageResult(null);
    setResult(null);
  };

  const handleAnalyzeImage = async () => {
    if (!imageFile) return;
    setLoading(true);
    setError(null);
    try {
      const res = await analyzeImage(imageFile);
      const data = { ...res.data, analysis_type: "image", imageUrl: imagePreview };
      setImageResult(data);
      setResult(null);
      setHistory(prev => [data, ...prev].slice(0, 10));
    } catch {
      setError("Image analysis failed. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  const handleClearImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setImageResult(null);
  };

  const handleSample = (s) => {
    setText(s);
    setResult(null);
  };

  const handleReset = () => {
    setText("");
    setResult(null);
    setImageFile(null);
    setImagePreview(null);
    setImageResult(null);
    setError(null);
  };

  const activeResult = imageResult || result;

  // Score bar width (0–100%)
  const scoreBarWidth = activeResult
    ? `${Math.round(((activeResult.score + 1) / 2) * 100)}%`
    : "50%";

  const scoreColor = activeResult
    ? activeResult.score > 0.05 ? "var(--positive)"
    : activeResult.score < -0.05 ? "var(--negative)"
    : "var(--neutral)"
    : "var(--accent)";

  const explanation = activeResult?.explanation;

  return (
    <div className={`${styles.page} fade-in`}>
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.title}><Zap size={22} style={{ verticalAlign: "middle", marginRight: 8 }} />Analyze Text</h1>
        <p className={styles.subtitle}>Paste any review or text to instantly detect its sentiment — with AI-powered explanations</p>
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

          <div className={styles.imageUploadPanel}>
            <div className={styles.imageUploadRow}>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                style={{ display: "none" }}
              />
              <button
                type="button"
                className={styles.uploadBtn}
                onClick={() => fileRef.current.click()}
              >
                <Upload size={14} /> Upload Image
              </button>
              <span className={styles.imageFileName}>
                {imageFile ? imageFile.name : "No file selected"}
              </span>
            </div>
            {imagePreview && (
              <div className={styles.imagePreview}>
                <img src={imagePreview} alt="Selected preview" className={styles.imagePreviewImg} />
                <button className={styles.imageClearBtn} onClick={handleClearImage}>
                  Remove
                </button>
              </div>
            )}
            <button
              className={styles.analyzeBtn}
              onClick={handleAnalyzeImage}
              disabled={loading || !imageFile}
              aria-label="Analyze image sentiment"
            >
              {loading && imageFile
                ? <><span className={styles.btnSpinner} /> Analyzing…</>
                : <><Upload size={15} /> Analyze Image</>
              }
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

          {!activeResult && !error && (
            <div className={styles.placeholder}>
              <span style={{ fontSize: "3.5rem" }}>🔍</span>
              <p>Your sentiment result will appear here</p>
              <p className={styles.hint}>Supports English + Hindi/Hinglish for text and visual image mood analysis</p>
            </div>
          )}

          {activeResult && (
            <div className={`${styles.resultCard} fade-in`}>
              <div className={styles.resultTop}>
                <SentimentBadge sentiment={activeResult.sentiment} />
                <span className={styles.scoreLabel}>
                  {activeResult.analysis_type === "image" ? "Visual Sentiment" : "Polarity Score"}
                </span>
              </div>

              {activeResult.analysis_type === "image" && activeResult.imageUrl && (
                <div className={styles.imageResultPreview}>
                  <img src={activeResult.imageUrl} alt="Analyzed image" />
                </div>
              )}

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
                {activeResult.score > 0 ? "+" : ""}{activeResult.score}
              </div>

              {activeResult.analysis_type === "text" && (
                <div className={styles.analyzedText}>
                  <p className={styles.analyzedLabel}>Analyzed text:</p>
                  <p className={styles.analyzedContent}>"{activeResult.text}"</p>
                </div>
              )}
              {activeResult.analysis_type === "image" && (
                <div className={styles.analyzedText}>
                  <p className={styles.analyzedLabel}>Analyzed image file:</p>
                  <p className={styles.analyzedContent}>{activeResult.filename}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Explanation Section ── */}
      {activeResult && explanation && (
        <div className={`${styles.explanationSection} fade-in-up`}>
          {/* Summary banner */}
          <div className={styles.explSummaryBanner} data-sentiment={activeResult.sentiment.toLowerCase()}>
            <span className={styles.explEmoji}>{SENTIMENT_EMOJI[activeResult.sentiment] || "🔍"}</span>
            <div className={styles.explSummaryText}>
              <div className={styles.explSummaryRow}>
                <Lightbulb size={15} />
                <span className={styles.explSummaryLabel}>Why this result?</span>
              </div>
              <p className={styles.explSummaryDesc}>{explanation.summary}</p>
            </div>
          </div>

          {/* Keywords detected */}
          {(explanation.positive_words?.length > 0 || explanation.negative_words?.length > 0) && (
            <div className={styles.explKeywords}>
              {explanation.positive_words?.length > 0 && (
                <div className={styles.explKeywordGroup}>
                  <span className={styles.explKeywordLabel}><ThumbsUp size={13} /> Positive signals</span>
                  <div className={styles.explChips}>
                    {explanation.positive_words.map((w, i) => (
                      <span key={i} className={`${styles.explChip} ${styles.explChipPos}`}>{w}</span>
                    ))}
                  </div>
                </div>
              )}
              {explanation.negative_words?.length > 0 && (
                <div className={styles.explKeywordGroup}>
                  <span className={styles.explKeywordLabel}><ThumbsDown size={13} /> Negative signals</span>
                  <div className={styles.explChips}>
                    {explanation.negative_words.map((w, i) => (
                      <span key={i} className={`${styles.explChip} ${styles.explChipNeg}`}>{w}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Polarity breakdown mini-bar */}
          <div className={styles.explBreakdown}>
            <div className={styles.explBreakdownRow}>
              <span className={styles.explBreakdownLabel}>English Base Polarity</span>
              <span className={styles.explBreakdownVal} style={{
                color: explanation.base_polarity > 0 ? "var(--positive)" : explanation.base_polarity < 0 ? "var(--negative)" : "var(--neutral)"
              }}>{explanation.base_polarity > 0 ? "+" : ""}{explanation.base_polarity}</span>
            </div>
            {explanation.keyword_boost !== 0 && (
              <div className={styles.explBreakdownRow}>
                <span className={styles.explBreakdownLabel}>Hindi Keyword Boost</span>
                <span className={styles.explBreakdownVal} style={{
                  color: explanation.keyword_boost > 0 ? "var(--positive)" : "var(--negative)"
                }}>{explanation.keyword_boost > 0 ? "+" : ""}{explanation.keyword_boost}</span>
              </div>
            )}
            <div className={`${styles.explBreakdownRow} ${styles.explBreakdownTotal}`}>
              <span className={styles.explBreakdownLabel}>Final Score</span>
              <span className={styles.explBreakdownVal} style={{ color: scoreColor, fontWeight: 700 }}>
                {explanation.final_polarity > 0 ? "+" : ""}{explanation.final_polarity}
              </span>
            </div>
          </div>

          {/* Detailed factors (collapsible) */}
          {explanation.factors?.length > 0 && (
            <div className={styles.explFactors}>
              <button
                className={styles.explFactorsToggle}
                onClick={() => setShowFactors(v => !v)}
              >
                <Info size={14} />
                <span>Detailed Analysis Factors ({explanation.factors.length})</span>
                {showFactors ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
              {showFactors && (
                <ul className={styles.explFactorList}>
                  {explanation.factors.map((f, i) => (
                    <li key={i} className={styles.explFactorItem}>
                      <ArrowRight size={12} className={styles.explFactorIcon} />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}

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
