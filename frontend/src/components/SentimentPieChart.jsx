import React from "react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

const COLORS = { Positive: "#4ade80", Negative: "#f87171", Neutral: "#fbbf24" };

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const { name, value } = payload[0];
  return (
    <div style={{
      background: "rgba(13,15,26,0.85)",
      backdropFilter: "blur(16px)",
      border: "1px solid rgba(255,255,255,0.12)",
      borderRadius: 8, padding: "8px 14px", fontSize: 12,
      boxShadow: "0 8px 32px rgba(0,0,0,0.4)"
    }}>
      <span style={{ color: COLORS[name], fontWeight: 700 }}>{name}</span>
      <span style={{ color: "rgba(255,255,255,0.5)", marginLeft: 8 }}>{value} reviews</span>
    </div>
  );
};

export default function SentimentPieChart({ stats }) {
  const data = [
    { name: "Positive", value: stats.Positive },
    { name: "Negative", value: stats.Negative },
    { name: "Neutral",  value: stats.Neutral  },
  ].filter(d => d.value > 0);

  return (
    <ResponsiveContainer width="100%" height={230}>
      <PieChart>
        <Pie data={data} cx="50%" cy="50%" innerRadius={58} outerRadius={88}
          paddingAngle={4} dataKey="value" strokeWidth={0}>
          {data.map(e => (
            <Cell key={e.name} fill={COLORS[e.name]} opacity={0.85}
              style={{ filter: `drop-shadow(0 0 6px ${COLORS[e.name]}55)` }} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend iconType="circle" iconSize={8}
          formatter={v => <span style={{ color: "rgba(255,255,255,0.45)", fontSize: 11 }}>{v}</span>} />
      </PieChart>
    </ResponsiveContainer>
  );
}
