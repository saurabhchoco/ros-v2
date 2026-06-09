import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { adminApi } from '../../services/adminApi';
import { apiService } from '../../services/api';
import Skeleton from '../../components/ui/Skeleton';
import PageHeader from '../../components/ui/PageHeader';
import InsightCard from '../../components/ui/InsightCard';
import MetricCard from '../../components/ui/MetricCard';
import SectionHeader from '../../components/ui/SectionHeader';
import EmptyState from '../../components/ui/EmptyState';

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer
} from 'recharts';
import {
  TrendingUp, Wallet, CreditCard, ShoppingBag,
  AlertCircle, CheckCircle, Clock, Coffee,
  BarChart3, Check, Circle
} from 'lucide-react';

export default function BrandOwnerDashboard() {
  const navigate = useNavigate();
  const outlet = useAuthStore((s) => s.outlet);
  const [outlets, setOutlets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [revenueData, setRevenueData] = useState([]);
  const [outletComparison, setOutletComparison] = useState([]);
  const [chartsLoading, setChartsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(Date.now());

  useEffect(() => {
    apiService.getDashboardSummary()
      .then(res => {
        setSummary(res.data.data);
        setLastUpdated(Date.now());
      })
      .catch(err => console.error(err))
      .finally(() => setSummaryLoading(false));
  }, []);

  const fetchRevenueTrend = async () => {
    try {
      const res = await apiService.getRevenueTrend(outlet?.organizationId);
      setRevenueData(res.data.data || []);
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
      Promise.all([fetchRevenueTrend(), fetchOutletComparison()])
        .finally(() => setChartsLoading(false));
    }
  }, [outlet]);

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

  if (loading) return <div className="p-6">Loading outlets...</div>;
  const filteredOutlets = outlets.filter(out => out.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const paymentTotal = summary?.paymentBreakdown?.reduce((sum, p) => sum + (p.total || 0), 0) || 1;
  const paymentBars = summary?.paymentBreakdown?.map(p => ({
    ...p,
    percent: (p.total / paymentTotal) * 100
  })) || [];

  const topItems = summary?.topItems?.map(item => ({
    ...item,
    percent: (item.revenue / (summary.totalRevenue || 1)) * 100
  })) || [];

  const sourceData = summary?.orderSource?.map(s => ({ name: s.source, value: s.count })) || [];

  // Insights only when outlets exist and there is data
  const insights = [];
  if (outlets.length > 0 && outletComparison.length > 0) {
    const topOutlet = outletComparison.reduce((max, o) => o.revenue > max.revenue ? o : max, outletComparison[0]);
    if (topOutlet) {
      insights.push({
        title: "Top Revenue Outlet",
        value: `${topOutlet.name} generated ₹${topOutlet.revenue}`
      });
    }
  }
  if (outlets.length > 0 && topItems[0]) {
    insights.push(`${topItems[0].item_name} contributes ${topItems[0].percent.toFixed(0)}% of sales`);
  }
  if (outlets.length > 0 && summary?.pendingOrders === 0) {
    insights.push(`No pending orders – kitchen is on top of it 🚀`);
  } else if (outlets.length > 0 && summary?.pendingOrders > 0) {
    insights.push(`${summary.pendingOrders} orders pending – check kitchen display`);
  }
  if (outlets.length > 0 && summary?.orderSource?.find(s => s.source === 'QR')?.count > 0) {
    insights.push(`QR orders are live – keep promoting the code`);
  }

  const maxRevenue = outletComparison.length > 0
    ? Math.max(...outletComparison.map(o => o.revenue))
    : 0;
  const maxOrders = outletComparison.length > 0
    ? Math.max(...outletComparison.map(o => o.orderCount))
    : 0;

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-8 font-sans">
      <PageHeader
        title="Brand Dashboard"
        description="Monitor performance across all outlets"
      />

      {/* ========== SECTION FOR BRAND OWNER WITH NO OUTLETS ========== */}
      {outlets.length === 0 ? (
        <>
          {/* Welcome Setup Card */}
          <div className="bg-gradient-to-r from-indigo-50 to-white rounded-2xl p-6 border border-indigo-100">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Welcome to ROS</h3>
                <p className="text-sm text-gray-600">Complete these steps to launch your brand operations.</p>
                <div className="mt-3 space-y-1">
                  <div className="flex items-center gap-2"><Check className="h-4 w-4 text-green-600" /> <span className="text-sm">Brand created</span></div>

                  <div className="flex items-center gap-2"><span className="text-sm">Next steps:</span></div>

                  <div className="flex items-center gap-2"><Circle className="h-4 w-4 text-gray-400" /> <span className="text-sm">Create your first outlet</span></div>
                  <div className="flex items-center gap-2"><Circle className="h-4 w-4 text-gray-400" /> <span className="text-sm">Add staff members</span></div>
                  {/* <div className="flex items-center gap-2"><Check className="h-4 w-4 text-green-600" /> <span className="text-sm">Configure printer</span></div> */}
                  <div className="flex items-center gap-2"><Circle className="h-4 w-4 text-gray-400" /> <span className="text-sm">Setup your menu</span></div>
                  <div className="flex items-center gap-2"><Circle className="h-4 w-4 text-gray-400" /> <span className="text-sm">Start taking orders</span></div>
                </div>
              </div>
              <button onClick={() => navigate('/owner/outlets/create')} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 whitespace-nowrap">
                + Create First Outlet
              </button>
            </div>
          </div>

          {/* Revenue Trend Empty State */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-white/20 shadow-[0_8px_30px_rgba(109,40,217,0.06)] p-5">
            <h3 className="font-semibold text-neutral-800 mb-4">Revenue Trend (Last 7 Days)</h3>
            <div className="flex flex-col items-center justify-center h-64 bg-neutral-50 rounded-xl">
              <BarChart3 className="h-12 w-12 text-gray-300 mb-3" />
              <p className="text-gray-500">Revenue Insights Will Appear Here</p>
              <p className="text-xs text-gray-400 mt-1">Once your outlet starts receiving orders, daily revenue trends will be automatically tracked.</p>
            </div>
          </div>

          {/* No Outlets Yet Empty State */}
          <EmptyState
            title="No Outlets Yet"
            message="Create your first outlet to start managing orders, staff, reports, and inventory."
            actionLabel="Create First Outlet"
            onAction={() => navigate('/owner/outlets/create')}
            icon="outlets"
          />
        </>
      ) : (
        /* ========== BRAND OWNER WITH AT LEAST ONE OUTLET ========== */
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {summaryLoading ? (
              [1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)
            ) : summary && (
              <>
                <MetricCard label="Today's Orders" value={summary.totalOrders} icon={ShoppingBag} accent="commercial" />
                <MetricCard label="Revenue Today" value={`₹${Number(summary.totalRevenue).toFixed(0)}`} icon={Wallet} accent="success" />
                <MetricCard label="Pending Orders" value={summary.pendingOrders} icon={Clock} accent='warning' />
                <MetricCard label="Avg Order Value" value={`₹${Number(summary.avgOrderValue).toFixed(0)}`} icon={CreditCard} />
                <MetricCard label="Cancelled Today" value={summary.totalCancellations || 0} icon={AlertCircle} accent='danger' />
              </>
            )}
          </div>

          {/* Revenue Trend Chart */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-white/20 shadow-[0_8px_30px_rgba(109,40,217,0.06)] p-5">
            <h3 className="font-semibold text-neutral-800 mb-4">Revenue Trend (Last 7 Days)</h3>
            {revenueData.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 bg-neutral-50 rounded-xl">
                <BarChart3 className="h-12 w-12 text-gray-300 mb-3" />
                <p className="text-gray-500">Revenue Insights Will Appear Here</p>
                <p className="text-xs text-gray-400 mt-1">Once your outlet starts receiving orders, daily revenue trends will be automatically tracked.</p>
              </div>
            ) : revenueData.length === 1 ? (
              <div className="bg-slate-50 rounded-xl p-8">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">Revenue Today</p>
                    <h3 className="text-3xl font-bold text-slate-900">₹{Number(summary?.totalRevenue || 0).toFixed(0)}</h3>
                    <p className="text-sm text-slate-500 mt-2">Collecting trend data</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400">Revenue trend available after 2 days</p>
                  </div>
                </div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4F46E5" stopOpacity={0.12} />
                      <stop offset="100%" stopColor="#6D4AFF" stopOpacity={0.01} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#4F46E5" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} width={40} />
                  <Tooltip
                    formatter={(value) => [`₹${value}`, 'Revenue']}
                    contentStyle={{ backgroundColor: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(8px)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.2)', boxShadow: '0 8px 20px rgba(0,0,0,0.08)', padding: '8px 12px' }}
                    labelStyle={{ fontWeight: 'bold', color: '#1E293B' }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#6D4AFF" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" fill="url(#colorRevenue)" dot={false} activeDot={{ r: 6, fill: '#6D4AFF', stroke: 'white', strokeWidth: 2 }} animationDuration={1400} animationEasing="ease-out" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Outlet Highlights */}
          {outletComparison.length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-neutral-800 mb-4">🏆 Outlet Highlights</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-emerald-50/80 to-emerald-100/50 backdrop-blur-sm rounded-xl border border-white/20 shadow-soft p-5">
                  <div className="flex items-center gap-2 mb-2"><span className="text-2xl">🏆</span><h4 className="font-semibold text-neutral-700">Top Revenue</h4></div>
                  <p className="text-2xl font-bold text-emerald-600">₹{Math.max(...outletComparison.map(o => o.revenue)).toFixed(0)}</p>
                  <p className="text-sm text-neutral-500 mt-1">{outletComparison.find(o => o.revenue === Math.max(...outletComparison.map(o => o.revenue)))?.name}</p>
                </div>
                <div className="bg-gradient-to-br from-purple-50/80 to-purple-100/50 backdrop-blur-sm rounded-xl border border-white/20 shadow-soft p-5">
                  <div className="flex items-center gap-2 mb-2"><span className="text-2xl">⚡</span><h4 className="font-semibold text-neutral-700">Highest AOV</h4></div>
                  <p className="text-2xl font-bold text-purple-600">₹{Math.max(...outletComparison.map(o => o.avgOrderValue)).toFixed(0)}</p>
                  <p className="text-sm text-neutral-500 mt-1">{outletComparison.find(o => o.avgOrderValue === Math.max(...outletComparison.map(o => o.avgOrderValue)))?.name}</p>
                </div>
                <div className="bg-gradient-to-br from-orange-50/80 to-orange-100/50 backdrop-blur-sm rounded-xl border border-white/20 shadow-soft p-5">
                  <div className="flex items-center gap-2 mb-2"><span className="text-2xl">📦</span><h4 className="font-semibold text-neutral-700">Most Orders</h4></div>
                  <p className="text-2xl font-bold text-orange-600">{Math.max(...outletComparison.map(o => o.orderCount))}</p>
                  <p className="text-sm text-neutral-500 mt-1">{outletComparison.find(o => o.orderCount === Math.max(...outletComparison.map(o => o.orderCount)))?.name}</p>
                </div>
              </div>
            </div>
          )}

          {/* Search & Outlet Cards */}
          <div className="relative">
            <input type="text" placeholder="Search outlets..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full max-w-md px-4 py-2 rounded-xl border border-neutral-200 bg-white/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500" />
          </div>
          {/* My Outlets Section */}
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-neutral-800">Brand Outlets</h2>
                <p className="text-neutral-500 text-sm">{filteredOutlets.length} outlets</p>
              </div>
              <button
                onClick={() => navigate('/owner/outlets/create')}
                className="px-4 py-2 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition shadow-soft"
              >
                + Add Outlet
              </button>
            </div>

            {filteredOutlets.length === 0 ? (
              <div className="text-center text-neutral-400 py-16">No outlets match your search.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredOutlets.map((out) => {
                  const outletStats = outletComparison.find((o) => o.id === out.id);
                  const status =
                    outletStats?.pendingOrders > 0
                      ? 'delayed'
                      : outletStats
                        ? 'healthy'
                        : 'inactive';
                  return (
                    <div
                      key={out.id}
                      className="bg-white/80 backdrop-blur-sm rounded-xl border border-neutral-200 shadow-soft p-5 transition-all hover:shadow-lg hover:-translate-y-1"
                    >
                      {/* Outlet Name & Type */}
                      <div>
                        <h3 className="text-lg font-bold text-neutral-800">{out.name}</h3>
                        <p className="text-xs text-neutral-500 mt-0.5">
                          {out.outlet_type || 'Restaurant'}
                        </p>
                      </div>

                      {/* Health Status */}
                      <div className="mt-3">
                        {status === 'healthy' && (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> 🟢 Healthy
                          </span>
                        )}
                        {status === 'delayed' && (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-orange-700 bg-orange-100 px-2 py-1 rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" /> ⚠ Delayed
                          </span>
                        )}
                        {status === 'inactive' && (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-neutral-500 bg-neutral-100 px-2 py-1 rounded-full">
                            ○ Inactive
                          </span>
                        )}
                      </div>

                      {/* Key Metrics */}
                      <div className="mt-4 space-y-2 text-sm">
                        <div className="flex justify-between items-baseline">
                          <span className="text-neutral-500">Revenue Today</span>
                          <span className="font-semibold text-emerald-600">
                            ₹{outletStats ? Number(outletStats.revenue).toFixed(0) : '0'}
                          </span>
                        </div>
                        <div className="flex justify-between items-baseline">
                          <span className="text-neutral-500">Orders Today</span>
                          <span className="font-semibold text-primary-600">
                            {outletStats?.orderCount ?? 0}
                          </span>
                        </div>
                      </div>

                      {/* Quick Action Chips */}
                      <div className="mt-5 flex flex-wrap gap-2">
                        <button
                          onClick={() => navigate(`/owner/menu?outlet=${out.id}`)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 text-xs font-medium hover:bg-gray-200 transition"
                        >
                          🍽 Menu
                        </button>
                        <button
                          onClick={() => navigate(`/owner/managers?outlet=${out.id}`)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 text-xs font-medium hover:bg-gray-200 transition"
                        >
                          👥 Users
                        </button>
                        <button
                          onClick={() => navigate(`/owner/outlet-analytics?outlet=${out.id}`)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 text-xs font-medium hover:bg-gray-200 transition"
                        >
                          📈 Analytics
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Insights */}
          {insights.length > 0 && (
            <div>
              <SectionHeader title="Quick Insights" description="Key operational observations" />
              <div className="grid md:grid-cols-3 gap-4">
                {insights.map((insight, index) => (
                  <InsightCard key={index} title={insight.title} value={insight.value} />
                ))}
              </div>
            </div>
          )}

          {/* Payment Methods + Top Items */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-white/20 shadow-[0_8px_30px_rgba(109,40,217,0.06)] p-5">
              <h3 className="font-semibold text-neutral-800 mb-4 flex items-center gap-2"><CreditCard className="w-4 h-4 text-primary-500" /> Payment Methods</h3>
              <div className="space-y-4">
                {paymentBars.length > 0 ? (
                  paymentBars.map(p => (
                    <div key={p.payment_method}>
                      <div className="flex justify-between text-sm mb-1"><span>{p.payment_method}</span><span>₹{Number(p.total).toFixed(0)}</span></div>
                      <div className="w-full bg-neutral-200 rounded-full h-2"><div className="bg-primary-500 h-2 rounded-full transition-all duration-700 ease-out" style={{ width: `${p.percent}%` }} /></div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <CreditCard className="h-8 w-8 text-gray-300 mb-2" />
                    <p className="text-sm text-gray-500">Payment Breakdown Unavailable</p>
                    <p className="text-xs text-gray-400">Payment analytics will appear after your first successful transaction.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-white/20 shadow-[0_8px_30px_rgba(109,40,217,0.06)] p-5">
              <h3 className="font-semibold text-neutral-800 mb-4 flex items-center gap-2"><Coffee className="w-4 h-4 text-primary-500" /> Top Selling Items</h3>
              <div className="space-y-4">
                {topItems.length > 0 ? (
                  topItems.map(item => (
                    <div key={item.item_name}>
                      <div className="flex justify-between text-sm mb-1"><span className="font-medium">{item.item_name}</span><span className="text-neutral-500">{item.total_qty} sold · ₹{item.revenue}</span></div>
                      <div className="w-full bg-neutral-200 rounded-full h-2"><div className="bg-emerald-500 h-2 rounded-full transition-all duration-700 ease-out" style={{ width: `${item.percent}%` }} /></div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <TrendingUp className="h-8 w-8 text-gray-300 mb-2" />
                    <p className="text-sm text-gray-500">Top Selling Items Will Appear Here</p>
                    <p className="text-xs text-gray-400">Popular menu items are calculated after customers place orders.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Operational Pipeline – Status Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-red-50/70 backdrop-blur-sm rounded-xl p-4 border border-red-100"><div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /><span className="text-sm font-medium text-red-700">New</span></div><p className="text-2xl font-bold text-red-800 mt-2">{summary?.orderStatus?.NEW || 0}</p></div>
            <div className="bg-yellow-50/70 backdrop-blur-sm rounded-xl p-4 border border-yellow-100"><div className="flex items-center gap-2"><Clock className="w-4 h-4 text-yellow-600" /><span className="text-sm font-medium text-yellow-700">Preparing</span></div><p className="text-2xl font-bold text-yellow-800 mt-2">{summary?.orderStatus?.PREPARING || 0}</p></div>
            <div className="bg-green-50/70 backdrop-blur-sm rounded-xl p-4 border border-green-100"><div className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-600" /><span className="text-sm font-medium text-green-700">Ready</span></div><p className="text-2xl font-bold text-green-800 mt-2">{summary?.orderStatus?.READY || 0}</p></div>
            <div className="bg-blue-50/70 backdrop-blur-sm rounded-xl p-4 border border-blue-100"><div className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-blue-600" /><span className="text-sm font-medium text-blue-700">Completed</span></div><p className="text-2xl font-bold text-blue-800 mt-2">{summary?.orderStatus?.COMPLETED || 0}</p></div>
          </div>

          {/* Revenue Performance Charts */}
          {!chartsLoading && (revenueData.length > 0 || sourceData.length > 0) && (
            <>
              <SectionHeader title="Revenue Performance" description="Revenue trends across the organization" />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-white/20 shadow-[0_8px_30px_rgba(109,40,217,0.06)] p-5">
                  <h3 className="font-semibold text-neutral-800 mb-4 flex items-center gap-2"><ShoppingBag className="w-4 h-4 text-primary-500" /> Orders by Source</h3>
                  <div className="space-y-4">
                    {sourceData.length > 0 ? (
                      sourceData.map((source, idx) => {
                        const total = sourceData.reduce((sum, s) => sum + s.value, 0);
                        const percent = (source.value / total) * 100;
                        const barColor = ['#6D4AFF', '#F59E0B', '#22C55E', '#EF4444'][idx % 4];
                        return (
                          <div key={source.name}>
                            <div className="flex justify-between text-sm mb-1"><span className="font-medium text-neutral-700">{source.name}</span><span className="text-neutral-500">{source.value} order{source.value !== 1 ? 's' : ''} ({percent.toFixed(0)}%)</span></div>
                            <div className="w-full bg-neutral-200 rounded-full h-2"><div className="h-2 rounded-full transition-all duration-700 ease-out" style={{ width: `${percent}%`, backgroundColor: barColor }} /></div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-neutral-400 text-sm">No order source data</p>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}