import React from "react";
import styles from "./StatCard.module.css";

/**
 * A metric card for the dashboard.
 * Props: title, value, subtitle, icon, accent (css color var name)
 */
export default function StatCard({ title, value, subtitle, icon, accent = "var(--accent)" }) {
  return (
    <div className={styles.card}>
      <div className={styles.iconWrap} style={{ background: `${accent}22`, color: accent }}>
        {icon}
      </div>
      <div className={styles.body}>
        <p className={styles.title}>{title}</p>
        <p className={styles.value}>{value}</p>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      </div>
    </div>
  );
}
