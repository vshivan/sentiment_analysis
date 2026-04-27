import React from "react";
import styles from "./SentimentBadge.module.css";

/**
 * Color-coded sentiment pill.
 * sentiment: "Positive" | "Negative" | "Neutral"
 */
export default function SentimentBadge({ sentiment }) {
  const cls = {
    Positive: styles.positive,
    Negative: styles.negative,
    Neutral:  styles.neutral,
  }[sentiment] || styles.neutral;

  const emoji = { Positive: "↑", Negative: "↓", Neutral: "→" }[sentiment] || "→";

  return (
    <span className={`${styles.badge} ${cls}`}>
      {emoji} {sentiment}
    </span>
  );
}
