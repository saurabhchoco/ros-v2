// dashboard/src/pages/Reports.jsx
import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '../store/authStore';
import { getTenantContext } from '../utils/tenantContext';
import { apiService } from '../services/api';
import Skeleton from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import { 
  Calendar, 
  TrendingUp, 
  ShoppingBag, 
  Wallet, 
  CheckCircle, 
  XCircle, 
  Clock,
  Coffee,
  CreditCard,
  Users,
  BarChart3
} from 'lucide-react';

const formatMoney = (value) => `₹${Number(value).toFixed(0)}`;

const formatDate = (date) => {
  const d = new Date(date);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const quickFilters = [
  { key: 'today', label: 'Today' },
  { key: 'yesterday', label: 'Yesterday' },
  { key: 'week', label: 'This Week' },
  { key: 'month', label: 'This Month' },
  { key: 'custom', label: 'Custom' }
];

const getDateRange = (filter, customStart, customEnd) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let start, end;
  switch (filter) {
    case 'today':
      start = today;
      end = now;
      break;
    case 'yesterday':
      start = new Date(today);
      start.setDate(today.getDate() - 1);
      end = new Date(start);
      end.setHours(23, 59, 59, 999);
      break;
    case 'week':
      start = new Date(today);
      start.setDate(today.getDate() - 7);
      end = now;
      break;
    case 'month':
      start = new Date(today);
      start.setMonth(today.getMonth() - 1);
      end = now;
      break;
    case 'custom':
      start = customStart ? new Date(customStart) : null;
      end = customEnd ? new Date(customEnd) : null;
      break;
    default:
      start = today;
      end = now;
  }
  if (!start || !end) return { startDate: '', endDate: '' };
  const startStr = start.toISOString().split('T')[0];
  const endStr = end.toISOString().split('T')[0];
  return { startDate: startStr, endDate: endStr };
};

export default function Reports() {
  const outlet = useAuthStore((s) => s.outlet);
  const { outletId } = getTenantContext(outlet);
  const [activeFilter, setActiveFilter] = useState('today');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchReport = useCallback(async (startDate, endDate) => {
    if (!outletId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiService.getReportDashboardRange(startDate, endDate);
      setData(res.data.data);
      setLastUpdated(new Date());
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to load report');
    } finally {
      setLoading(false);
    }
  }, [outletId]);

  useEffect(() => {
    if (!outletId) return;
    const { startDate, endDate } = getDateRange(activeFilter, customStart, customEnd);
    if (startDate && endDate) {
      fetchReport(startDate, endDate);
    }
  }, [activeFilter, customStart, customEnd, outletId, fetchReport]);

  const handleFilterClick = (filterKey) => {
    setActiveFilter(filterKey);
    if (filterKey !== 'custom') {
      setCustomStart('');
      setCustomEnd('');
    }
  };

  const applyCustomRange = () => {
    if (customStart && customEnd) {
      setActiveFilter('custom');
    }
  };

  if (!outletId) {
    return <div className="p-6 text-red-500">No outlet assigned</div>;
  }

  if (loading && !data) {
    return (
      <div className="p-6 max-w-[1400px] mx-auto space-y-8">
        {/* skeletons... (same as before) */}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center text-red-500">
        <p>{error}</p>
        <button onClick={() => fetchReport(getDateRange(activeFilter, customStart, customEnd).startDate, getDateRange(activeFilter, customStart, customEnd).endDate)} className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg">Retry</button>
      </div>
    );
  }

  if (!data || (data.orders === 0 && data.revenue === 0)) {
    return (
      <div className="p-6 max-w-[1400px] mx-auto">
        <EmptyState
          title="No data available"
          message="Try another date range or wait for orders to be placed."
          icon="reports"
        />
      </div>
    );
  }

  const { revenue, orders, aov, completed, cancelled, settlementPending, paymentBreakdown, orderSources, topItems, operationalStatus } = data;
  const totalSettled = completed; // settled orders count
  const settlementRate = totalSettled > 0 ? ((totalSettled - settlementPending) / totalSettled) * 100 : 0;

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
        <p className="text-sm text-gray-500 mt-1">Track outlet performance and operational metrics</p>
      </div>

      {/* Quick Filters */}
      <div className="flex flex-wrap gap-2">
        {quickFilters.map((filter) => (
          <button
            key={filter.key}
            onClick={() => handleFilterClick(filter.key)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition ${
              activeFilter === filter.key
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Custom date range */}
      {activeFilter === 'custom' && (
        <div className="flex flex-wrap gap-4 items-end bg-gray-50 p-4 rounded-xl">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">From</label>
            <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} className="border rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">To</label>
            <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} className="border rounded-lg px-3 py-2 text-sm" />
          </div>
          <button onClick={applyCustomRange} disabled={!customStart || !customEnd} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm disabled:opacity-50">Apply</button>
        </div>
      )}

      {/* Last updated */}
      {lastUpdated && <div className="text-right text-xs text-gray-400">Updated {lastUpdated.toLocaleTimeString()}</div>}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-indigo-50 rounded-xl p-4">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Revenue</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{formatMoney(revenue)}</p>
        </div>
        <div className="bg-green-50 rounded-xl p-4">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Orders</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{orders}</p>
        </div>
        <div className="bg-blue-50 rounded-xl p-4">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Avg Order</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{formatMoney(aov)}</p>
        </div>
        <div className="bg-emerald-50 rounded-xl p-4">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Completed</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{completed}</p>
        </div>
        <div className="bg-red-50 rounded-xl p-4">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Cancelled</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{cancelled}</p>
        </div>
        <div className="bg-amber-50 rounded-xl p-4">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Pending Settlement</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{settlementPending}</p>
        </div>
      </div>

      {/* Row 1: Revenue Summary (hero) + Payment Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Summary Card - hero style */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Revenue Summary</h3>
          <p className="text-5xl font-bold text-gray-900 mt-2">{formatMoney(revenue)}</p>
          <div className="mt-4 text-sm text-gray-500 space-y-1">
            <div className="flex justify-between"><span>Settled Orders</span><span className="font-medium">{completed}</span></div>
            <div className="flex justify-between"><span>Avg Order Value</span><span className="font-medium">{formatMoney(aov)}</span></div>
          </div>
        </div>

        {/* Payment Breakdown Card with percentages */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-2"><CreditCard className="h-4 w-4" /> Payment Breakdown</h3>
          <div className="mt-4 space-y-4">
            {Object.entries(paymentBreakdown).length === 0 ? (
              <p className="text-gray-400 text-sm">No payments settled</p>
            ) : (
              Object.entries(paymentBreakdown).map(([method, total]) => {
                const percent = (total / revenue) * 100;
                return (
                  <div key={method}>
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{method}</span>
                      <span>{formatMoney(total)} ({percent.toFixed(0)}%)</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                      <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${percent}%` }}></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Row 2: Order Sources + Operational Status (compact) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Order Sources Card with progress bars */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-2"><Coffee className="h-4 w-4" /> Order Sources</h3>
          <div className="mt-3 space-y-3">
            {Object.entries(orderSources).map(([source, count]) => {
              const totalOrders = orders;
              const percent = (count / totalOrders) * 100;
              const label = source === 'DINE_IN' ? '🍽 Dine In' : source === 'TAKEAWAY' ? '🥡 Takeaway' : '🛵 Delivery';
              return (
                <div key={source}>
                  <div className="flex justify-between text-sm">
                    <span>{label}</span>
                    <span>{count} ({percent.toFixed(0)}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                    <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${percent}%` }}></div>
                  </div>
                </div>
              );
            })}
            {Object.keys(orderSources).length === 0 && <p className="text-gray-400 text-sm">No orders found</p>}
          </div>
        </div>

        {/* Operational Status Card with badges */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-2"><BarChart3 className="h-4 w-4" /> Operational Status</h3>
          <div className="mt-3 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Completed</span>
              <span className="bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded-full">{operationalStatus.completed}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Cancelled</span>
              <span className="bg-red-100 text-red-800 text-xs font-semibold px-2 py-1 rounded-full">{operationalStatus.cancelled}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Pending Settlement</span>
              <span className="bg-amber-100 text-amber-800 text-xs font-semibold px-2 py-1 rounded-full">{operationalStatus.settlementPending}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-gray-100">
              <span className="text-sm font-medium text-gray-700">Settlement Rate</span>
              <span className="text-sm font-bold text-indigo-600">{settlementRate.toFixed(1)}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Top Selling Items – compact rows */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-2">🏆 Top Selling Items</h3>
        <div className="mt-3 space-y-2">
          {topItems.length === 0 ? (
            <p className="text-gray-400 text-sm">No items sold</p>
          ) : (
            topItems.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center text-sm border-b border-gray-100 last:border-0 py-2">
                <div><span className="font-medium">{idx+1}. {item.name}</span></div>
                <div className="flex gap-4">
                  <span className="text-gray-500">{item.quantity} sold</span>
                  <span className="text-gray-700 font-medium">{formatMoney(item.revenue)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}