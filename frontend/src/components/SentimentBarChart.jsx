import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const C = { Positive: "#3ecf6e", Negative: "#f56565", Neutral: "#f6ad3c" };

const Tip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "rgba(11,13,22,0.92)", backdropFilter: "blur(16px)",
      border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8,
      padding: "10px 14px", fontSize: 12, boxShadow: "0 8px 32px rgba(0,0,0,0.5)"
    }}>
      <p style={{ color: "rgba(255,255,255,0.65)", fontWeight: 600, marginBottom: 6 }}>{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: C[p.name], marginTop: 3 }}>
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
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} barCategoryGap="38%" barGap={2}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
        <XAxis dataKey="name" tick={{ fill: "rgba(255,255,255,0.28)", fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: "rgba(255,255,255,0.28)", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip content={<Tip />} cursor={{ fill: "rgba(255,255,255,0.025)" }} />
        <Legend iconType="circle" iconSize={7}
          formatter={v => <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 11 }}>{v}</span>} />
        <Bar dataKey="Positive" fill={C.Positive} radius={[3,3,0,0]} opacity={0.82} />
        <Bar dataKey="Negative" fill={C.Negative} radius={[3,3,0,0]} opacity={0.82} />
        <Bar dataKey="Neutral"  fill={C.Neutral}  radius={[3,3,0,0]} opacity={0.82} />
      </BarChart>
    </ResponsiveContainer>
  );
}
