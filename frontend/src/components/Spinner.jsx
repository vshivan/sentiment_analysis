import React from "react";
import styles from "./Spinner.module.css";

export default function Spinner({ label = "Loading…", size = 36 }) {
  return (
    <div className={styles.wrapper} role="status" aria-label={label}>
      <div className={styles.track} style={{ width: size, height: size }}>
        <div className={styles.ring} style={{ width: size, height: size }} />
        <div className={styles.core} style={{ width: size * 0.35, height: size * 0.35 }} />
      </div>
      {label && <p className={styles.label}>{label}</p>}
    </div>
  );
}
