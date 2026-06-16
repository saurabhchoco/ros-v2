import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { safeNumber } from '../utils/formatters';

export default function RevenueSparkline({ data }) {
  if (!data || data.length === 0) return null;
  const chartData = data.map(d => ({ date: d.date, revenue: safeNumber(d.revenue) }));
  const total = chartData.reduce((sum, d) => sum + d.revenue, 0);
  return (
    <div className="bg-white rounded-xl shadow-sm p-4">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-[18px] font-medium">Revenue (7 days)</h2>
        <span className="text-xs text-gray-400">₹{total.toLocaleString()} total</span>
      </div>
      <ResponsiveContainer width="100%" height={60}>
        <LineChart data={chartData}>
          <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={1.5} dot={false} />
        </LineChart>
      </ResponsiveContainer>
      <div className="flex justify-between text-[10px] text-gray-400 mt-1">
        <span>{new Date(chartData[0].date).getDate()}</span>
        <span>{new Date(chartData[chartData.length-1].date).getDate()}</span>
      </div>
    </div>
  );
}