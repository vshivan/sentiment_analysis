import React from "react";
import styles from "./Spinner.module.css";

export default function Spinner({ size = 40, label = "Loading…" }) {
  return (
    <div className={styles.wrapper} role="status" aria-label={label}>
      <div className={styles.ring} style={{ width: size, height: size }} />
      <span className={styles.label}>{label}</span>
    </div>
  );
}
