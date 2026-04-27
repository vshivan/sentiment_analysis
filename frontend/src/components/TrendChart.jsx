import React from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from "recharts";

export default function TrendChart({ reviews }) {
  const data = reviews.map((r, i) => ({
    n: `#${i + 1}`,
    score: parseFloat((r.score * 100).toFixed(1)),
  }));

  const Tip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    const v = payload[0].value;
    const c = v > 5 ? "#3ecf6e" : v < -5 ? "#f56565" : "#f6ad3c";
    return (
      <div style={{
        background: "rgba(11,13,22,0.92)", backdropFilter: "blur(16px)",
        border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8,
        padding: "8px 12px", fontSize: 12, boxShadow: "0 8px 32px rgba(0,0,0,0.5)"
      }}>
        <p style={{ color: "rgba(255,255,255,0.35)", marginBottom: 3 }}>{label}</p>
        <p style={{ color: c, fontWeight: 700 }}>{v > 0 ? "+" : ""}{v}</p>
      </div>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={180}>
      <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 0, left: -12 }}>
        <defs>
          <linearGradient id="tg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#7b6ef6" stopOpacity={0.22} />
            <stop offset="95%" stopColor="#7b6ef6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
        <XAxis dataKey="n" tick={{ fill: "rgba(255,255,255,0.28)", fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: "rgba(255,255,255,0.28)", fontSize: 11 }} axisLine={false} tickLine={false} />
        <ReferenceLine y={0} stroke="rgba(255,255,255,0.07)" strokeDasharray="4 4" />
        <Tooltip content={<Tip />} />
        <Area type="monotone" dataKey="score" stroke="#7b6ef6" strokeWidth={2}
          fill="url(#tg)"
          dot={{ fill: "#7b6ef6", r: 3, strokeWidth: 0, opacity: 0.75 }}
          activeDot={{ r: 5, strokeWidth: 0, fill: "#a99df9" }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
