import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const COLORS = { Positive: "#4ade80", Negative: "#f87171", Neutral: "#fbbf24" };

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "rgba(13,15,26,0.9)", backdropFilter: "blur(16px)",
      border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8,
      padding: "10px 14px", fontSize: 12, boxShadow: "0 8px 32px rgba(0,0,0,0.4)"
    }}>
      <p style={{ color: "rgba(255,255,255,0.7)", fontWeight: 600, marginBottom: 6 }}>{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: COLORS[p.name], marginTop: 3 }}>
          {p.name}: <strong>{p.value}</strong>
        </p>
      ))}
    </div>
  );
};

export default function SentimentBarChart({ productStats }) {
  const data = Object.entries(productStats).map(([name, s]) => ({
    name: name.length > 9 ? name.slice(0, 9) + "…" : name,
    Positive: s.Positive, Negative: s.Negative, Neutral: s.Neutral,
  }));

  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={data} barCategoryGap="35%" barGap={2}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
        <XAxis dataKey="name" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
        <Legend iconType="circle" iconSize={8}
          formatter={v => <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 11 }}>{v}</span>} />
        <Bar dataKey="Positive" fill={COLORS.Positive} radius={[3,3,0,0]} opacity={0.8} />
        <Bar dataKey="Negative" fill={COLORS.Negative} radius={[3,3,0,0]} opacity={0.8} />
        <Bar dataKey="Neutral"  fill={COLORS.Neutral}  radius={[3,3,0,0]} opacity={0.8} />
      </BarChart>
    </ResponsiveContainer>
  );
}
