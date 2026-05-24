import { AreaChart, Area, ResponsiveContainer } from 'recharts';

export default function Sparkline({ data, color = '#22C55E' }) {
  if (!data || data.length === 0) return null;
  return (
    <ResponsiveContainer width={80} height={30}>
      <AreaChart data={data}>
        <Area
          type="monotone"
          dataKey="revenue"
          stroke={color}
          fill={`${color}20`}
          strokeWidth={1.5}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}