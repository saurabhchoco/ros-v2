import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { apiService } from '../../services/api';
import Skeleton from '../../components/ui/Skeleton';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { Wallet, ShoppingBag, CreditCard, TrendingUp, Menu } from 'lucide-react';

const COLORS = ['#6D4AFF', '#F59E0B', '#22C55E', '#EF4444'];

export default function OutletAnalytics() {
  const [searchParams] = useSearchParams();
  const outletId = searchParams.get('outlet');
  const outlet = useAuthStore((s) => s.outlet);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [revenueData, setRevenueData] = useState([]);
  const [orderStatusData, setOrderStatusData] = useState([]);
  const [topItems, setTopItems] = useState([]);
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    if (!outletId) return;
    fetchAnalytics();
  }, [outletId]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      // Fetch outlet analytics (assuming endpoint exists)
      const res = await apiService.getOutletAnalytics(outletId);
      const data = res.data.data;
      setRevenueData(data.revenueTrend || []);
      setOrderStatusData(data.orderStatus || []);
      setTopItems(data.topItems || []);
      setSummary(data.summary || { totalRevenue: 0, totalOrders: 0, avgOrderValue: 0 });
    } catch (err) {
      console.error('Failed to load outlet analytics:', err);
      // Fallback empty data
      setRevenueData([]);
      setOrderStatusData([]);
      setTopItems([]);
      setSummary({ totalRevenue: 0, totalOrders: 0, avgOrderValue: 0 });
    } finally {
      setLoading(false);
    }
  };

  const hasOrders = summary?.totalOrders > 0;

  if (loading) {
    return (
      <div className="p-6">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[1,2,3].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <button
          onClick={() => navigate('/owner')}
          className="text-indigo-500 text-sm font-medium hover:underline mb-2 inline-block"
        >
          ← Back to Outlets
        </button>
        <h1 className="text-2xl font-bold text-gray-800">
          Analytics – {outlet?.outletName || outlet?.name || 'Outlet'}
        </h1>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <Wallet className="h-6 w-6 text-emerald-500" />
            <span className="text-sm text-gray-500 uppercase tracking-wide">Revenue</span>
          </div>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            ₹{Number(summary?.totalRevenue || 0).toFixed(0)}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <ShoppingBag className="h-6 w-6 text-indigo-500" />
            <span className="text-sm text-gray-500 uppercase tracking-wide">Orders</span>
          </div>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {summary?.totalOrders || 0}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <CreditCard className="h-6 w-6 text-purple-500" />
            <span className="text-sm text-gray-500 uppercase tracking-wide">Avg Order Value</span>
          </div>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            ₹{Number(summary?.avgOrderValue || 0).toFixed(0)}
          </p>
        </div>
      </div>

      {/* Main Content – Empty State vs Charts */}
      {!hasOrders ? (
        <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
          <div className="flex flex-col items-center justify-center py-8">
            <div className="bg-indigo-50 rounded-full p-4 mb-4">
              <TrendingUp className="h-12 w-12 text-indigo-500" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Analytics Will Start Tracking Automatically</h3>
            <p className="text-gray-500 max-w-md mb-6">
              Once customers begin placing orders, ROS will automatically track:
            </p>
            <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left w-full max-w-md">
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-sm text-gray-600">✓ Revenue trends</li>
                <li className="flex items-center gap-2 text-sm text-gray-600">✓ Top selling items</li>
                <li className="flex items-center gap-2 text-sm text-gray-600">✓ Order performance</li>
                <li className="flex items-center gap-2 text-sm text-gray-600">✓ Average order value</li>
              </ul>
            </div>
            <button
              onClick={() => navigate(`/owner/menu?outlet=${outletId}`)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition shadow-sm"
            >
              <Menu className="h-4 w-4" />
              Open Menu
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Revenue Trend Chart (full width) */}
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h3 className="font-semibold text-gray-800 mb-4">Revenue Trend (Last 7 Days)</h3>
            {revenueData.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-gray-400">Insufficient data for trend</div>
            ) : revenueData.length === 1 ? (
              <div className="bg-gray-50 rounded-xl p-8 text-center">
                <p className="text-sm text-gray-500">Collecting more data... trend will appear after 2 days</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6D4AFF" stopOpacity={0.12} />
                      <stop offset="100%" stopColor="#6D4AFF" stopOpacity={0.01} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} width={40} />
                  <Tooltip formatter={(value) => [`₹${value}`, 'Revenue']} />
                  <Area type="monotone" dataKey="revenue" stroke="#6D4AFF" strokeWidth={3} fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Two columns: Top Selling Items + Order Status Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Selling Items */}
            <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-indigo-500" /> Top Selling Items
              </h3>
              <div className="space-y-3">
                {topItems.length === 0 ? (
                  <p className="text-gray-400 text-sm">No items sold yet</p>
                ) : (
                  topItems.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">{item.name}</span>
                      <span className="text-sm text-gray-500">{item.quantity} sold · ₹{item.revenue}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Order Status Breakdown */}
            <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <ShoppingBag className="h-4 w-4 text-indigo-500" /> Order Status
              </h3>
              {orderStatusData.length === 0 ? (
                <p className="text-gray-400 text-sm">No status data</p>
              ) : (
                <div className="space-y-3">
                  {orderStatusData.map((status, idx) => {
                    const percent = status.percent || (status.count / orderStatusData.reduce((sum, s) => sum + s.count, 0)) * 100;
                    return (
                      <div key={idx}>
                        <div className="flex justify-between text-sm mb-1">
                          <span>{status.name}</span>
                          <span>{status.count} ({percent.toFixed(0)}%)</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="h-2 rounded-full"
                            style={{ width: `${percent}%`, backgroundColor: COLORS[idx % COLORS.length] }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}