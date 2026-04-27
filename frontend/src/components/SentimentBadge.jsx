import React from "react";
import styles from "./SentimentBadge.module.css";

const CONFIG = {
  Positive: { label: "Positive", dot: "var(--positive)", cls: "positive" },
  Negative: { label: "Negative", dot: "var(--negative)", cls: "negative" },
  Neutral:  { label: "Neutral",  dot: "var(--neutral)",  cls: "neutral"  },
};

export default function SentimentBadge({ sentiment, size = "md" }) {
  const cfg = CONFIG[sentiment] || CONFIG.Neutral;
  return (
    <span className={`${styles.badge} ${styles[cfg.cls]} ${styles[size]}`}>
      <span className={styles.dot} style={{ background: cfg.dot }} />
      {cfg.label}
    </span>
  );
}
