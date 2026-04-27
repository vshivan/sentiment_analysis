import React from "react";
import styles from "./StatCard.module.css";

export default function StatCard({ title, value, subtitle, icon, accent = "var(--accent)", trend }) {
  return (
    <div className={`${styles.card} fade-in`}>
      {/* Accent top line */}
      <div className={styles.accentLine} style={{ background: accent }} />

      <div className={styles.inner}>
        <div className={styles.iconWrap} style={{ background: `${accent}18`, color: accent }}>
          {icon}
        </div>
        <div className={styles.body}>
          <p className={styles.title}>{title}</p>
          <p className={styles.value}>{value}</p>
          {subtitle && (
            <p className={styles.subtitle}>
              {trend && (
                <span className={styles.trend} style={{
                  color: trend > 0 ? "var(--positive)" : trend < 0 ? "var(--negative)" : "var(--text-4)"
                }}>
                  {trend > 0 ? "↑" : trend < 0 ? "↓" : "→"}
                </span>
              )}
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className={styles.card}>
      <div className={styles.accentLine} style={{ background: "var(--gb-1)" }} />
      <div className={styles.inner}>
        <div className={`${styles.iconWrap} skeleton`} style={{ background: "none" }} />
        <div className={styles.body}>
          <div className="skeleton" style={{ height: 10, width: 80, marginBottom: 8 }} />
          <div className="skeleton" style={{ height: 28, width: 60, marginBottom: 6 }} />
          <div className="skeleton" style={{ height: 9, width: 110 }} />
        </div>
      </div>
    </div>
  );
}
