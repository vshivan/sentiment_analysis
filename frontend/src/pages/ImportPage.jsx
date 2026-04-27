import React, { useEffect, useState, useRef } from "react";
import { fetchProducts, bulkImport, analyzeText } from "../api";
import Spinner from "../components/Spinner";
import SentimentBadge from "../components/SentimentBadge";
import { Upload, FileText, CheckCircle, X, Zap } from "lucide-react";
import styles from "./ImportPage.module.css";

const PRODUCT_ICONS = {
  Adidas:"👟", Zara:"👗", Dell:"💻", Supra:"👠",
  iPhone:"📱", Lenskart:"👓", "Lloyd AC":"❄️", "Titan Watch":"⌚"
};

export default function ImportPage() {
  const [products,  setProducts]  = useState([]);
  const [selected,  setSelected]  = useState("");
  const [rawText,   setRawText]   = useState("");
  const [previews,  setPreviews]  = useState([]);   // [{ text, sentiment, score }]
  const [loading,   setLoading]   = useState(false);
  const [previewing,setPreviewing]= useState(false);
  const [result,    setResult]    = useState(null);  // { added }
  const [error,     setError]     = useState(null);
  const fileRef = useRef();

  useEffect(() => {
    fetchProducts().then(r => {
      setProducts(r.data.products);
      setSelected(r.data.products[0] || "");
    });
  }, []);

  // Parse textarea — one review per line
  const parseLines = (text) =>
    text.split("\n").map(l => l.trim()).filter(Boolean);

  // Preview: analyze each line before importing
  const handlePreview = async () => {
    const lines = parseLines(rawText);
    if (!lines.length) return;
    setPreviewing(true);
    setError(null);
    try {
      const results = await Promise.all(lines.map(text => analyzeText(text)));
      setPreviews(results.map(r => r.data));
    } catch {
      setError("Preview failed. Is the backend running?");
    } finally {
      setPreviewing(false);
    }
  };

  // Import confirmed previews
  const handleImport = async () => {
    const lines = parseLines(rawText);
    if (!lines.length || !selected) return;
    setLoading(true);
    setError(null);
    try {
      const res = await bulkImport(selected, lines);
      setResult(res.data);
      setRawText("");
      setPreviews([]);
    } catch {
      setError("Import failed. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  // Handle file upload (txt or json)
  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target.result;
      if (file.name.endsWith(".json")) {
        try {
          const parsed = JSON.parse(content);
          const lines = Array.isArray(parsed) ? parsed : parsed.reviews || [];
          setRawText(lines.join("\n"));
        } catch { setError("Invalid JSON file."); }
      } else {
        setRawText(content);
      }
      setPreviews([]);
      setResult(null);
    };
    reader.readAsText(file);
  };

  const clearAll = () => { setRawText(""); setPreviews([]); setResult(null); setError(null); };

  const lineCount = parseLines(rawText).length;

  return (
    <div className={`${styles.page} fade-in`}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Data Management</p>
          <h1 className={styles.title}>
            <Upload size={20} style={{ verticalAlign:"middle", marginRight:8, opacity:0.8 }} />
            Bulk Import Reviews
          </h1>
          <p className={styles.subtitle}>Paste reviews (one per line) or upload a .txt / .json file</p>
        </div>
      </div>

      <div className={styles.body}>
        {/* Left — input */}
        <div className={styles.inputCard}>
          {/* Product selector */}
          <div className={styles.field}>
            <label className={styles.fieldLabel}>Target Product</label>
            <div className={styles.productSelect}>
              {products.map(p => (
                <button
                  key={p}
                  className={`${styles.productChip} ${selected === p ? styles.chipActive : ""}`}
                  onClick={() => setSelected(p)}
                >
                  {PRODUCT_ICONS[p] || "📦"} {p}
                </button>
              ))}
            </div>
          </div>

          {/* Textarea */}
          <div className={styles.field}>
            <div className={styles.fieldLabelRow}>
              <label className={styles.fieldLabel}>Reviews</label>
              <span className={styles.lineCount}>{lineCount} line{lineCount !== 1 ? "s" : ""}</span>
            </div>
            <textarea
              className={styles.textarea}
              placeholder={"Paste reviews here, one per line…\n\nExample:\nGreat product, totally worth it!\nBahut bekar hai, waste of money.\nDelivery was okay, nothing special."}
              value={rawText}
              onChange={e => { setRawText(e.target.value); setPreviews([]); setResult(null); }}
              rows={10}
            />
          </div>

          {/* File upload */}
          <div className={styles.uploadRow}>
            <input ref={fileRef} type="file" accept=".txt,.json" onChange={handleFile} style={{ display:"none" }} />
            <button className={styles.uploadBtn} onClick={() => fileRef.current.click()}>
              <FileText size={14} /> Upload .txt / .json
            </button>
            {rawText && (
              <button className={styles.clearBtn} onClick={clearAll}>
                <X size={13} /> Clear
              </button>
            )}
          </div>

          {error && <div className={styles.errorBox}>{error}</div>}

          {result && (
            <div className={styles.successBox}>
              <CheckCircle size={16} />
              Successfully imported <strong>{result.added}</strong> reviews into <strong>{selected}</strong>
            </div>
          )}

          {/* Actions */}
          <div className={styles.actions}>
            <button
              className={styles.previewBtn}
              onClick={handlePreview}
              disabled={!rawText.trim() || previewing}
            >
              {previewing ? <><span className={styles.btnSpinner} /> Analyzing…</> : <><Zap size={14} /> Preview Sentiment</>}
            </button>
            <button
              className={styles.importBtn}
              onClick={handleImport}
              disabled={!rawText.trim() || !selected || loading}
            >
              {loading ? <><span className={styles.btnSpinner} /> Importing…</> : <><Upload size={14} /> Import {lineCount > 0 ? lineCount : ""} Reviews</>}
            </button>
          </div>
        </div>

        {/* Right — preview */}
        <div className={styles.previewCard}>
          <div className={styles.previewHeader}>
            <h2 className={styles.previewTitle}>Sentiment Preview</h2>
            {previews.length > 0 && (
              <div className={styles.previewStats}>
                <span style={{ color:"var(--positive)" }}>+{previews.filter(p=>p.sentiment==="Positive").length}</span>
                <span style={{ color:"var(--negative)" }}>−{previews.filter(p=>p.sentiment==="Negative").length}</span>
                <span style={{ color:"var(--neutral)" }}>~{previews.filter(p=>p.sentiment==="Neutral").length}</span>
              </div>
            )}
          </div>

          {previewing && <Spinner label="Analyzing reviews…" />}

          {!previewing && previews.length === 0 && (
            <div className={styles.previewEmpty}>
              <Zap size={32} style={{ opacity:0.2 }} />
              <p>Click "Preview Sentiment" to see analysis before importing</p>
            </div>
          )}

          {!previewing && previews.length > 0 && (
            <div className={styles.previewList}>
              {previews.map((p, i) => (
                <div key={i} className={styles.previewRow}>
                  <div className={styles.previewTop}>
                    <span className={styles.previewNum}>#{i+1}</span>
                    <SentimentBadge sentiment={p.sentiment} />
                    <span className={styles.previewScore} style={{
                      color: p.score > 0.05 ? "var(--positive)" : p.score < -0.05 ? "var(--negative)" : "var(--neutral)"
                    }}>{p.score > 0 ? "+" : ""}{p.score}</span>
                  </div>
                  <p className={styles.previewText}>{p.text}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
