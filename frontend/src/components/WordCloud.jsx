import React, { useMemo } from "react";
import styles from "./WordCloud.module.css";

const COLORS = [
  "#7c74c9", "#5aaa7a", "#b89a4e", "#9d97d8",
  "#6b9fc4", "#c0605a", "#7ab8a0", "#a07cc0",
  "#8aaa6a", "#c09060",
];

export default function WordCloud({ words }) {
  const maxVal = useMemo(() => Math.max(...words.map(w => w.value), 1), [words]);

  return (
    <div className={styles.cloud} role="img" aria-label="Keyword word cloud">
      {words.map((w, i) => {
        const ratio  = w.value / maxVal;
        const size   = 0.72 + ratio * 1.2;        // rem: 0.72 → 1.92
        const color  = COLORS[i % COLORS.length];
        const opacity = 0.45 + ratio * 0.55;
        return (
          <span
            key={w.text}
            className={styles.word}
            style={{ fontSize: `${size}rem`, color, opacity }}
            title={`${w.text} · ${w.value}×`}
          >
            {w.text}
          </span>
        );
      })}
    </div>
  );
}
