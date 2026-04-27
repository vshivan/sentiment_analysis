import React, { useMemo } from "react";
import styles from "./WordCloud.module.css";

const PALETTE = [
  "#7b6ef6", "#3ecf6e", "#f6ad3c", "#a99df9",
  "#5eaad4", "#f56565", "#68d391", "#b794f4",
  "#76e4f7", "#f6c90e", "#fc8181", "#9ae6b4",
];

export default function WordCloud({ words }) {
  const maxVal = useMemo(() => Math.max(...words.map(w => w.value), 1), [words]);

  return (
    <div className={styles.cloud} role="img" aria-label="Keyword word cloud">
      {words.map((w, i) => {
        const ratio   = w.value / maxVal;
        const size    = 0.7 + ratio * 1.25;
        const color   = PALETTE[i % PALETTE.length];
        const opacity = 0.4 + ratio * 0.6;
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
