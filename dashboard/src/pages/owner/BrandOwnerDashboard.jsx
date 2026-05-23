import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { adminApi } from '../../services/adminApi';
import { apiService } from '../../services/api';
import Skeleton from '../../components/ui/Skeleton';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import {
  TrendingUp, TrendingDown, Wallet, CreditCard, ShoppingBag,
  AlertCircle, CheckCircle, Clock, Coffee, Store, Zap
} from 'lucide-react';

const COLORS = ['#4f46e5', '#f59e0b', '#10b981', '#ef4444'];

export default function BrandOwnerDashboard() {
  const navigate = useNavigate();
  const outlet = useAuthStore((s) => s.outlet);
  const [outlets, setOutlets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [revenueData, setRevenueData] = useState([]);
  const [statusData, setStatusData] = useState([]);
  const [outletComparison, setOutletComparison] = useState([]);
  const [chartsLoading, setChartsLoading] = useState(true);

  // Fetch dashboard summary
  useEffect(() => {
    apiService.getDashboardSummary()
      .then(res => setSummary(res.data.data))
      .catch(err => console.error(err))
      .finally(() => setSummaryLoading(false));
  }, []);

  // Fetch charts data
  const fetchRevenueTrend = async () => {
    try {
      const res = await apiService.getRevenueTrend(outlet?.organizationId);
      setRevenueData(res.data.data || []);
    } catch (err) { console.error(err); }
  };
  const fetchOrderStatus = async () => {
    try {
      const res = await apiService.getOrderStatusDistribution(outlet?.organizationId);
      setStatusData(res.data.data || []);
    } catch (err) { console.error(err); }
  };
  const fetchOutletComparison = async () => {
    try {
      const res = await apiService.getOutletComparison(outlet?.organizationId);
      setOutletComparison(res.data.data || []);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    if (outlet?.organizationId) {
      Promise.all([fetchRevenueTrend(), fetchOrderStatus(), fetchOutletComparison()])
        .finally(() => setChartsLoading(false));
    }
  }, [outlet]);

  // Load outlets
  useEffect(() => {
    const orgId = outlet?.organization_id || outlet?.organizationId;
    if (!orgId) { setLoading(false); return; }
    const load = async () => {
      try {
        const res = await adminApi.listOutlets(orgId, true);
        setOutlets(res.data.data || []);
      } catch (e) { console.error(e); } finally { setLoading(false); }
    };
    load();
  }, [outlet]);

  // Helper: compute trend vs yesterday from revenueData
  const getTrendVsYesterday = () => {
    if (!revenueData || revenueData.length < 2) return null;
    const today = revenueData[revenueData.length - 1]?.revenue || 0;
    const yesterday = revenueData[revenueData.length - 2]?.revenue || 0;
    if (yesterday === 0) return null;
    const percent = ((today - yesterday) / yesterday) * 100;
    return { percent, isPositive: percent >= 0 };
  };
  const trend = getTrendVsYesterday();

  // Prepare payment breakdown for horizontal bars
  const paymentTotal = summary?.paymentBreakdown?.reduce((sum, p) => sum + (p.total || 0), 0) || 1;
  const paymentBars = summary?.paymentBreakdown?.map(p => ({
    ...p,
    percent: (p.total / paymentTotal) * 100
  })) || [];

  // Prepare top items with percent
  const topItems = summary?.topItems?.map(item => ({
    ...item,
    percent: (item.revenue / (summary.totalRevenue || 1)) * 100
  })) || [];

  // Prepare order source for donut chart
  const sourceData = summary?.orderSource?.map(s => ({ name: s.source, value: s.count })) || [];

  // Quick insights (static logic – can be enhanced)
  const insights = [];
  if (outletComparison.length > 0) {
    const topOutlet = outletComparison.reduce((max, o) => o.revenue > max.revenue ? o : max, outletComparison[0]);
    insights.push(`${topOutlet.name} generated ${((topOutlet.revenue / (summary?.totalRevenue || 1)) * 100).toFixed(0)}% of revenue`);
  }
  if (topItems[0]) {
    insights.push(`${topItems[0].item_name} contributes ${topItems[0].percent.toFixed(0)}% of sales`);
  }
  if (summary?.pendingOrders === 0) {
    insights.push(`No pending orders – kitchen is on top of it 🚀`);
  } else if (summary?.pendingOrders > 0) {
    insights.push(`${summary.pendingOrders} orders pending – check kitchen display`);
  }
  if (summary?.orderSource?.find(s => s.source === 'QR')?.count > 0) {
    insights.push(`QR orders are live – keep promoting the code`);
  }

  if (loading) return <div className="p-6">Loading outlets...</div>;
  const filteredOutlets = outlets.filter(out => out.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-8 font-sans">
      {/* Search Bar */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search outlets..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full max-w-md px-4 py-2 rounded-xl border border-gray-200 bg-white/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
        />
      </div>

      {/* Summary KPIs + Quick Insights row */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {summaryLoading ? (
          <>
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-32 rounded-2xl" />)}
          </>
        ) : summary && (
          <>
            {/* Today's Orders */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 shadow-lg p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-50 rounded-xl">
                    <ShoppingBag className="w-5 h-5 text-indigo-600" />
                  </div>
                  <p className="text-sm font-medium text-gray-500">Today's Orders</p>
                </div>
              </div>
              <p className="text-4xl font-bold text-gray-900 mt-2">{summary.totalOrders}</p>
            </div>

            {/* Revenue Today with trend */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 shadow-lg p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-50 rounded-xl">
                    <Wallet className="w-5 h-5 text-emerald-600" />
                  </div>
                  <p className="text-sm font-medium text-gray-500">Revenue Today</p>
                </div>
                {trend && (
                  <span className={`text-xs font-medium flex items-center gap-1 ${trend.isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
                    {trend.isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {Math.abs(trend.percent).toFixed(1)}%
                  </span>
                )}
              </div>
              <p className="text-4xl font-bold text-gray-900 mt-2">₹{Number(summary.totalRevenue).toFixed(0)}</p>
            </div>

            {/* Pending Orders with alert color */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 shadow-lg p-5">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${summary.pendingOrders > 0 ? 'bg-orange-50' : 'bg-gray-50'}`}>
                  <Clock className={`w-5 h-5 ${summary.pendingOrders > 0 ? 'text-orange-600' : 'text-gray-400'}`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Pending Orders</p>
                  <p className={`text-3xl font-bold ${summary.pendingOrders > 0 ? 'text-orange-600' : 'text-gray-600'}`}>
                    {summary.pendingOrders}
                  </p>
                </div>
              </div>
            </div>

            {/* Avg Order Value */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 shadow-lg p-5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-50 rounded-xl">
                  <CreditCard className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Avg Order Value</p>
                  <p className="text-2xl font-bold text-gray-900">₹{Number(summary.avgOrderValue).toFixed(0)}</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Quick Insights Block */}
      {insights.length > 0 && (
        <div className="bg-gradient-to-r from-indigo-50 to-indigo-100/50 rounded-2xl p-5 border border-indigo-200">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-5 h-5 text-indigo-600" />
            <h3 className="font-semibold text-indigo-900">Quick Insights</h3>
          </div>
          <div className="flex flex-wrap gap-3">
            {insights.map((insight, idx) => (
              <span key={idx} className="text-sm text-indigo-800 bg-white/60 px-3 py-1.5 rounded-full">
                {insight}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Two column: Payment Methods + Top Items */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Methods with Horizontal Bars */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 shadow-lg p-5">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-indigo-500" /> Payment Methods
          </h3>
          <div className="space-y-4">
            {paymentBars.length > 0 ? (
              paymentBars.map(p => (
                <div key={p.payment_method}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{p.payment_method}</span>
                    <span>₹{Number(p.total).toFixed(0)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-indigo-500 h-2 rounded-full"
                      style={{ width: `${p.percent}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-400 text-sm">No payment data</p>
            )}
          </div>
        </div>

        {/* Top Selling Items with Progress Bars */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 shadow-lg p-5">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Coffee className="w-4 h-4 text-indigo-500" /> Top Selling Items
          </h3>
          <div className="space-y-4">
            {topItems.length > 0 ? (
              topItems.map(item => (
                <div key={item.item_name}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">{item.item_name}</span>
                    <span className="text-gray-500">
                      {item.total_qty} sold · ₹{item.revenue}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-emerald-500 h-2 rounded-full"
                      style={{ width: `${item.percent}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-400 text-sm">No orders yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Order Status Cards (micro visual indicators) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-red-50/70 backdrop-blur-sm rounded-xl p-4 border border-red-100">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-sm font-medium text-red-700">New</span>
          </div>
          <p className="text-2xl font-bold text-red-800 mt-2">{summary?.orderStatus?.NEW || 0}</p>
        </div>
        <div className="bg-yellow-50/70 backdrop-blur-sm rounded-xl p-4 border border-yellow-100">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-yellow-600" />
            <span className="text-sm font-medium text-yellow-700">Preparing</span>
          </div>
          <p className="text-2xl font-bold text-yellow-800 mt-2">{summary?.orderStatus?.PREPARING || 0}</p>
        </div>
        <div className="bg-green-50/70 backdrop-blur-sm rounded-xl p-4 border border-green-100">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-green-700">Ready</span>
          </div>
          <p className="text-2xl font-bold text-green-800 mt-2">{summary?.orderStatus?.READY || 0}</p>
        </div>
        <div className="bg-blue-50/70 backdrop-blur-sm rounded-xl p-4 border border-blue-100">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-700">Completed</span>
          </div>
          <p className="text-2xl font-bold text-blue-800 mt-2">{summary?.orderStatus?.COMPLETED || 0}</p>
        </div>
      </div>

      {/* Charts Row: Revenue Area Chart + Donut Chart */}
      {!chartsLoading && (revenueData.length > 0 || sourceData.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Area Chart */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 shadow-lg p-5">
            <h3 className="font-semibold text-gray-800 mb-4">Revenue Trend (Last 7 Days)</h3>
            {revenueData.length === 0 ? (
              <div className="bg-gray-50 rounded-xl p-8 text-center text-gray-400">No revenue data yet</div>
            ) : revenueData.length === 1 ? (
              <div className="bg-gray-50 rounded-xl p-8 text-center text-gray-400">Need 2+ days to show trend</div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value) => `₹${value}`} />
                  <Area type="monotone" dataKey="revenue" stroke="#4f46e5" fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Donut Chart for Orders by Source */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 shadow-lg p-5">
            <h3 className="font-semibold text-gray-800 mb-4">Orders by Source</h3>
            {sourceData.length === 0 ? (
              <div className="bg-gray-50 rounded-xl p-8 text-center text-gray-400">No order source data</div>
            ) : (
              <div className="flex flex-col items-center">
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={sourceData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      label
                    >
                      {sourceData.map((entry, idx) => (
                        <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
                <div className="text-center mt-2">
                  <p className="text-2xl font-bold text-gray-800">{sourceData.reduce((s, c) => s + c.value, 0)}</p>
                  <p className="text-xs text-gray-500">Total Orders</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Outlet Cards with strong hierarchy */}
      <div className="flex items-center justify-between mt-8 mb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">My Outlets</h2>
          <p className="text-gray-500 text-sm">{filteredOutlets.length} outlets</p>
        </div>
        <button onClick={() => navigate('/owner/outlets/create')} className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition shadow-sm">+ Add Outlet</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredOutlets.map(out => {
          const outletStats = outletComparison.find(o => o.id === out.id);
          return (
            <div key={out.id} className="bg-white/80 backdrop-blur-sm rounded-2xl border-l-4 border-indigo-500 shadow-lg p-5 transition hover:shadow-xl">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold text-gray-800">{out.name}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">{out.outlet_type}</p>
                </div>
                {outletStats?.pendingOrders > 0 && (
                  <span className="bg-orange-100 text-orange-700 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {outletStats.pendingOrders} pending
                  </span>
                )}
              </div>
              {outletStats ? (
                <div className="mt-4 grid grid-cols-2 gap-2 text-sm border-t pt-3 border-gray-100">
                  <div>
                    <p className="text-gray-500">Revenue</p>
                    <p className="font-bold text-emerald-600">₹{Number(outletStats.revenue).toFixed(0)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Orders</p>
                    <p className="font-bold text-indigo-600">{outletStats.orderCount}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Avg Order</p>
                    <p className="font-bold text-purple-600">₹{Number(outletStats.avgOrderValue).toFixed(0)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Pending</p>
                    <p className={`font-bold ${outletStats.pendingOrders > 0 ? 'text-orange-600' : 'text-gray-400'}`}>
                      {outletStats.pendingOrders}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-gray-400 text-sm mt-2">No orders today</p>
              )}
              <div className="flex gap-2 mt-5">
                <button onClick={() => navigate(`/owner/menu?outlet=${out.id}`)} className="flex-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition">Menu</button>
                <button onClick={() => navigate(`/owner/managers?outlet=${out.id}`)} className="flex-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition">Managers</button>
                <button onClick={() => navigate(`/owner/outlet-analytics?outlet=${out.id}`)} className="flex-1 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-sm font-medium hover:bg-indigo-100 transition">Analytics</button>
              </div>
            </div>
          );
        })}
        {filteredOutlets.length === 0 && <div className="text-center text-gray-400 py-16 col-span-2">No outlets match your search.</div>}
      </div>

      {/* Outlet Performance Table (with pending column) */}
      {outletComparison.length > 0 && (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 shadow-lg p-5 mt-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Outlet Performance</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50/50">
                <tr className="border-b">
                  <th className="text-left p-3 font-semibold text-gray-600">Outlet</th>
                  <th className="text-right p-3 font-semibold text-gray-600">Orders</th>
                  <th className="text-right p-3 font-semibold text-gray-600">Revenue</th>
                  <th className="text-right p-3 font-semibold text-gray-600">Avg Order</th>
                  <th className="text-right p-3 font-semibold text-gray-600">Pending</th>
                </tr>
              </thead>
              <tbody>
                {outletComparison.map(out => (
                  <tr key={out.id} className="border-b hover:bg-gray-50/50">
                    <td className="p-3 font-medium">{out.name}</td>
                    <td className="p-3 text-right">{out.orderCount}</td>
                    <td className="p-3 text-right">₹{Number(out.revenue).toFixed(0)}</td>
                    <td className="p-3 text-right">₹{Number(out.avgOrderValue).toFixed(0)}</td>
                    <td className="p-3 text-right font-medium">{out.pendingOrders}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}