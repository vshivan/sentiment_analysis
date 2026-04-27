import React from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from "recharts";

export default function TrendChart({ reviews }) {
  const data = reviews.map((r, i) => ({
    review: `#${i + 1}`,
    score: parseFloat((r.score * 100).toFixed(1)),
  }));

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    const val = payload[0].value;
    const color = val > 5 ? "#4ade80" : val < -5 ? "#f87171" : "#fbbf24";
    return (
      <div style={{
        background: "rgba(13,15,26,0.9)", backdropFilter: "blur(16px)",
        border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8,
        padding: "8px 12px", fontSize: 12, boxShadow: "0 8px 32px rgba(0,0,0,0.4)"
      }}>
        <p style={{ color: "rgba(255,255,255,0.4)", marginBottom: 3 }}>{label}</p>
        <p style={{ color, fontWeight: 700 }}>{val > 0 ? "+" : ""}{val}</p>
      </div>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={185}>
      <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 0, left: -10 }}>
        <defs>
          <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#7c6ff7" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#7c6ff7" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
        <XAxis dataKey="review" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} axisLine={false} tickLine={false} />
        <ReferenceLine y={0} stroke="rgba(255,255,255,0.08)" strokeDasharray="4 4" />
        <Tooltip content={<CustomTooltip />} />
        <Area type="monotone" dataKey="score" stroke="#7c6ff7" strokeWidth={2}
          fill="url(#trendGrad)"
          dot={{ fill: "#7c6ff7", r: 3, strokeWidth: 0, opacity: 0.8 }}
          activeDot={{ r: 5, strokeWidth: 0, fill: "#a89cf8" }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
