import React from "react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

const C = { Positive: "#3ecf6e", Negative: "#f56565", Neutral: "#f6ad3c" };

const Tip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const { name, value } = payload[0];
  return (
    <div style={{
      background: "rgba(11,13,22,0.92)", backdropFilter: "blur(16px)",
      border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8,
      padding: "8px 14px", fontSize: 12, boxShadow: "0 8px 32px rgba(0,0,0,0.5)"
    }}>
      <span style={{ color: C[name], fontWeight: 700 }}>{name}</span>
      <span style={{ color: "rgba(255,255,255,0.4)", marginLeft: 8 }}>{value} reviews</span>
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
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie data={data} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
          paddingAngle={4} dataKey="value" strokeWidth={0}>
          {data.map(e => (
            <Cell key={e.name} fill={C[e.name]} opacity={0.88}
              style={{ filter: `drop-shadow(0 0 7px ${C[e.name]}55)` }} />
          ))}
        </Pie>
        <Tooltip content={<Tip />} />
        <Legend iconType="circle" iconSize={7}
          formatter={v => <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 11 }}>{v}</span>} />
      </PieChart>
    </ResponsiveContainer>
  );
}
