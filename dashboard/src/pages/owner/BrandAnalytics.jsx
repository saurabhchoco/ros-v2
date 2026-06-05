import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { apiService } from '../../services/api';
import { formatPercent } from '../../lib/utils';

// Severity colors for insight cards
const severityColors = {
  critical: 'border-red-200 bg-red-50',
  warning: 'border-yellow-200 bg-yellow-50',
  info: 'border-blue-200 bg-blue-50',
  success: 'border-green-200 bg-green-50',
};

const InsightCard = ({ insight }) => {
  const bgClass = severityColors[insight.severity] || severityColors.info;
  return (
    <div className={`rounded-xl border p-4 ${bgClass}`}>
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-gray-800">{insight.title}</h3>
          <p className="text-sm text-gray-600 mt-1">{insight.description}</p>
        </div>
        {insight.severity === 'critical' && (
          <span className="text-xs font-medium text-red-600 uppercase">Alert</span>
        )}
      </div>
    </div>
  );
};

const Trend = ({ value, isNew }) => {
  if (isNew) return <span className="text-xs text-gray-400">New</span>;
  if (value === undefined || value === null) return null;
  const num = parseFloat(value);
  if (isNaN(num)) return null;
  const isPositive = num > 0;
  return (
    <span className={`inline-flex items-center gap-1 text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
      {isPositive ? '↑' : '↓'} {formatPercent(Math.abs(num))}
    </span>
  );
};

const PeriodSelector = ({ period, setPeriod }) => {
  const periods = [
    { key: 'day', label: 'Today' },
    { key: 'week', label: '7D' },
    { key: 'month', label: '30D' },
  ];
  return (
    <div className="flex gap-2">
      {periods.map((p) => (
        <button
          key={p.key}
          onClick={() => setPeriod(p.key)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            period === p.key
              ? 'bg-indigo-500 text-white shadow-sm'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
};

const OutletRanking = ({ outlets }) => {
  const activeOutlets = outlets.filter((o) => parseFloat(o.revenue) > 0 || o.orders > 0);
  if (activeOutlets.length === 0) {
    return <div className="text-gray-400 text-sm">No active outlets in this period</div>;
  }
  return (
    <div className="space-y-3">
      {activeOutlets.map((outlet, idx) => (
        <div key={outlet.outlet_id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition">
          <div className="flex items-center gap-3">
            <div className="w-8 text-lg font-bold text-gray-300">#{idx + 1}</div>
            <div>
              <div className="font-medium text-gray-800">{outlet.outlet_name}</div>
              <div className="text-xs text-gray-400">{outlet.orders || 0} orders</div>
            </div>
          </div>
          <div className="text-right">
            <div className="font-semibold text-gray-800">₹{parseFloat(outlet.revenue || 0).toLocaleString()}</div>
            {outlet.share_of_brand_pct > 0 && (
              <div className="text-xs text-gray-400">{formatPercent(outlet.share_of_brand_pct)} of revenue</div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

const TopProducts = ({ products }) => {
  const medals = ['🥇', '🥈', '🥉'];
  if (!products || products.length === 0) {
    return (
      <div className="text-gray-400 text-sm">
        Product insights will appear after 10 completed orders.<br/>
        You'll be able to track revenue contribution and top performers.
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {products.slice(0, 5).map((product, idx) => (
        <div key={product.product_id} className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">{medals[idx] || '🏅'}</span>
            <span className="font-medium text-gray-800">{product.product_name}</span>
          </div>
          <div className="text-right">
            <div className="font-semibold text-indigo-600">₹{product.revenue}</div>
            <div className="text-xs text-gray-400">{product.quantity_sold} sold</div>
          </div>
        </div>
      ))}
    </div>
  );
};

const CategoryBars = ({ categories }) => {
  if (!categories || categories.length === 0) {
    return (
      <div className="text-gray-400 text-sm">
        Category insights will appear after 10 completed orders.<br/>
        You'll be able to track revenue contribution and fastest growing categories.
      </div>
    );
  }
  const total = categories.reduce((sum, cat) => sum + (cat.revenue || 0), 0);
  return (
    <div className="space-y-2">
      {categories.map((cat) => {
        const percent = total > 0 ? (cat.revenue / total) * 100 : 0;
        return (
          <div key={cat.category_id}>
            <div className="flex justify-between text-sm mb-1">
              <span>{cat.category_name}</span>
              <span className="text-gray-500">{formatPercent(percent)}</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${percent}%` }}></div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const PeakHours = ({ peakHours, totalOrders }) => {
  if (!peakHours || peakHours.length === 0 || totalOrders < 20) {
    return (
      <div className="text-gray-400 text-sm">
        Peak hour analysis requires at least 20 completed orders.
      </div>
    );
  }
  const validData = peakHours.filter(p => p.hour >= 0 && p.hour <= 23 && p.order_count > 0);
  return (
    <div>
      <div className="h-32">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={validData}>
            <XAxis dataKey="hour" tick={{ fontSize: 10 }} domain={[0, 23]} />
            <YAxis allowDecimals={false} />
            <Tooltip formatter={(value) => [`${value} orders`, 'Orders']} />
            <Bar dataKey="order_count" fill="#818cf8" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default function BrandAnalytics() {
  const navigate = useNavigate();
  const [period, setPeriod] = useState('week');
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiService.getBrandAnalytics(period);
      if (!res.data?.data) throw new Error('Invalid response');
      setAnalytics(res.data.data);
    } catch (err) {
      console.error(err);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-6 max-w-7xl mx-auto animate-pulse">Loading analytics...</div>;
  if (error) return <div className="p-6 text-center text-red-500">{error} <button onClick={fetchAnalytics} className="ml-4 px-3 py-1 bg-indigo-500 text-white rounded">Retry</button></div>;
  if (!analytics) return null;

  const { summary, health, outlets, products, categories, peakHours, insights, revenueTrend } = analytics;
  const hasData = summary.revenue > 0 || summary.orders > 0;
  const totalOrders = summary.orders || 0;

  // Determine hero insight (most important)
  let heroInsight = null;
  if (insights && insights.length > 0) {
    heroInsight = insights[0];
  }

  // Revenue trend: check if we have at least 2 data points
  const hasRevenueTrend = revenueTrend && revenueTrend.length > 1;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Analytics</h1>
          <p className="text-gray-500 text-sm mt-1">Performance across all outlets</p>
        </div>
        <PeriodSelector period={period} setPeriod={setPeriod} />
      </div>

      {/* Hero Insight Banner */}
      {heroInsight && (
        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-2 text-indigo-800">
            <span className="text-lg">🏆</span>
            <span className="font-semibold">{heroInsight.title}</span>
          </div>
          <p className="text-sm text-indigo-700 mt-1">{heroInsight.description}</p>
        </div>
      )}

      {/* KPI Row – Business Health placeholder (no confusing score) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <div className="text-sm text-gray-500 flex items-center gap-2">
            Business Health
            <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">Beta</span>
          </div>
          <div className="text-3xl font-bold text-gray-800 mt-1">—</div>
          <div className="text-xs text-gray-400 mt-2">
            Health score will appear once we have enough data across revenue, orders, and completion rates.
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <div className="text-sm text-gray-500">Revenue</div>
          <div className="text-3xl font-bold text-gray-800 mt-1">₹{summary.revenue.toLocaleString()}</div>
          <div className="flex items-center gap-2 mt-1">
            <Trend value={summary.revenue_growth_pct} isNew={summary.prev_revenue === 0 && summary.revenue > 0} />
            <span className="text-xs text-gray-400">vs previous period</span>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <div className="text-sm text-gray-500">Orders</div>
          <div className="text-3xl font-bold text-gray-800 mt-1">{summary.orders.toLocaleString()}</div>
          <div className="flex items-center gap-2 mt-1">
            <Trend value={summary.orders_growth_pct} isNew={summary.prev_orders === 0 && summary.orders > 0} />
            <span className="text-xs text-gray-400">vs previous period</span>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <div className="text-sm text-gray-500">Average Order Value</div>
          <div className="text-3xl font-bold text-gray-800 mt-1">₹{summary.aov.toLocaleString()}</div>
          <div className="flex items-center gap-2 mt-1">
            <Trend value={summary.aov_growth_pct} />
            <span className="text-xs text-gray-400">vs previous period</span>
          </div>
        </div>
      </div>

      {!hasData && (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center mb-8">
          <p className="text-gray-500">No order data yet for the selected period.</p>
          <p className="text-sm text-gray-400 mt-2">Once you start receiving orders, analytics will appear here.</p>
        </div>
      )}

      {hasData && (
        <>
          {/* Revenue Trend Chart */}
          <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm mb-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Revenue Trend</h2>
            {hasRevenueTrend ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={revenueTrend} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(dateStr) => {
                      const d = new Date(dateStr);
                      return `${d.getDate()} ${d.toLocaleString('default', { month: 'short' })}`;
                    }}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis tickFormatter={(v) => `₹${v / 1000}k`} />
                  <Tooltip formatter={(value) => [`₹${value}`, 'Revenue']} />
                  <Line type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-gray-400 text-center">
                <p>Revenue trend requires at least 7 days of transaction history.</p>
                <p className="text-sm mt-1">Current progress: {totalOrders > 0 ? 'Some orders exist, but not enough daily data yet.' : 'No orders yet.'}</p>
              </div>
            )}
          </div>

          {/* Two columns: Outlet Ranking + Peak Hours */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Outlet Ranking</h2>
              <OutletRanking outlets={outlets} />
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Peak Hours</h2>
              <PeakHours peakHours={peakHours} totalOrders={totalOrders} />
            </div>
          </div>

          {/* Top Products + Category Performance */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Top Products</h2>
              <TopProducts products={products} />
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Category Performance</h2>
              <CategoryBars categories={categories} />
            </div>
          </div>

          {/* Additional insight cards (if any left after hero) */}
          {insights && insights.length > 1 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {insights.slice(1).map((insight, idx) => (
                <InsightCard key={idx} insight={insight} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}