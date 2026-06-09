import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { adminApi } from '../../services/adminApi';
import { apiService } from '../../services/api';
import Skeleton from '../../components/ui/Skeleton';
import PageHeader from '../../components/ui/PageHeader';
import InsightCard from '../../components/ui/InsightCard';
import HealthScoreCard from '../../components/ui/HealthScoreCard';
import MetricCard from '../../components/ui/MetricCard';
import SectionHeader from '../../components/ui/SectionHeader';

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import {
  TrendingUp, TrendingDown, Wallet, CreditCard, ShoppingBag,
  AlertCircle, CheckCircle, Clock, Coffee, Zap, Package
} from 'lucide-react';

const COLORS = ['#6D4AFF', '#F59E0B', '#22C55E', '#EF4444'];

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
  const [lastUpdated, setLastUpdated] = useState(Date.now());
  const [stockHealth, setStockHealth] = useState(null);

  useEffect(() => {
    apiService.getDashboardSummary()
      .then(res => {
        setSummary(res.data.data);
        setLastUpdated(Date.now());
      })
      .catch(err => console.error(err))
      .finally(() => setSummaryLoading(false));
  }, []);

  // const fetchStockHealth = async () => {
  //   try {
  //     const res = await apiService.getInventoryHealth();
  //     setStockHealth(res.data.data);
  //   } catch (err) { console.error(err); }
  // };

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

  const getTrendVsYesterday = () => {
    if (!revenueData || revenueData.length < 2) return null;
    const today = revenueData[revenueData.length - 1]?.revenue || 0;
    const yesterday = revenueData[revenueData.length - 2]?.revenue || 0;
    if (yesterday === 0) return null;
    const percent = ((today - yesterday) / yesterday) * 100;
    return { percent, isPositive: percent >= 0 };
  };
  const trend = getTrendVsYesterday();

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

  const insights = [];
  if (outletComparison.length > 0) {
    const topOutlet = outletComparison.reduce((max, o) => o.revenue > max.revenue ? o : max, outletComparison[0]);

    if (topOutlet) {
      insights.push({
        title: "Top Revenue Outlet",
        value: `${topOutlet.name} generated ₹${topOutlet.revenue}`
      });
    }

    // insights.push({
    //   title: "Operations",
    //   value:
    //     summary.pendingOrders === 0
    //       ? "No pending kitchen orders"
    //       : `${summary.pendingOrders} orders awaiting action`
    // });

    // insights.push({
    //   title: "Stock Health",
    //   value: `${stockHealth?.stockHealthPct || 100}% inventory healthy`
    // });
    // insights.push(`${topOutlet.name} generated ${((topOutlet.revenue / (summary?.totalRevenue || 1)) * 100).toFixed(0)}% of revenue`);
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

  const maxRevenue = outletComparison.length > 0
    ? Math.max(...outletComparison.map(o => o.revenue))
    : 0;
  const maxOrders = outletComparison.length > 0
    ? Math.max(...outletComparison.map(o => o.orderCount))
    : 0;
  const secondsSinceUpdate = Math.floor((Date.now() - lastUpdated) / 1000);
  const updatedText = secondsSinceUpdate < 60 ? `${secondsSinceUpdate} sec ago` : `${Math.floor(secondsSinceUpdate / 60)} min ago`;
  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-8 font-sans">
      <PageHeader
        title="Brand Dashboard"
        description="Monitor performance across all outlets"
      />

      {/* {!summaryLoading && summary && (
        <HealthScoreCard
          score={96}
          status="A+"
          subtitle="Brand operating normally"
          healthItems={[
            `${summary.pendingOrders} Pending Orders`,
            `${stockHealth?.stockHealthPct || 100}% Stock Health`,
            "All Systems Operational"
          ]}
        />
      )} */}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {summaryLoading ? (
          [1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)
        ) : summary && (
          <>
            <MetricCard
              label="Today's Orders"
              value={summary.totalOrders}
              icon={ShoppingBag}
              accent="commercial"
            />

            <MetricCard
              label="Revenue Today"
              value={`₹${Number(summary.totalRevenue).toFixed(0)}`}
              subtitle={
                trend
                  ? `${Math.abs(trend.percent).toFixed(1)}% vs yesterday`
                  : undefined
              }
              icon={Wallet}
              accent="success"
            />

            <MetricCard
              label="Pending Orders"
              value={summary.pendingOrders}
              icon={Clock}
              accent='warning'
            />

            <MetricCard
              label="Avg Order Value"
              value={`₹${Number(summary.avgOrderValue).toFixed(0)}`}
              icon={CreditCard}
            />

            {/* Cancelled Today */}
            <MetricCard
              label="Cancelled Today"
              value={summary.totalCancellations || 0}
              icon={AlertCircle}
              accent='danger'
            />

            {/* <MetricCard
              label="Stock Health"
              value={`${stockHealth?.stockHealthPct || 100}%`}
              subtitle={`${stockHealth?.lowStockCount || 0} low stock items`}
              icon={Package}
            /> */}
          </>
        )}
      </div>

      <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-white/20 shadow-[0_8px_30px_rgba(109,40,217,0.06)] p-5">
        <h3 className="font-semibold text-neutral-800 mb-4">Revenue Trend (Last 7 Days)</h3>
        {revenueData.length === 0 ? (
          <div className="bg-neutral-50 rounded-xl p-8 text-center text-neutral-400">No revenue data yet</div>
        ) : revenueData.length === 1 ? (
          <div className="bg-slate-50 rounded-xl p-8">

            <div className="flex items-center justify-between">

              <div>
                <p className="text-sm text-slate-500">
                  Revenue Today
                </p>

                <h3 className="text-3xl font-bold text-slate-900">
                  ₹{Number(summary?.totalRevenue || 0).toFixed(0)}
                </h3>

                <p className="text-sm text-slate-500 mt-2">
                  Collecting trend data
                </p>
              </div>

              <div className="text-right">
                <p className="text-xs text-slate-400">
                  Revenue trend available after 2 days
                </p>
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
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12, fill: '#64748B' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 12, fill: '#64748B' }}
                axisLine={false}
                tickLine={false}
                width={40}
              />
              <Tooltip
                formatter={(value) => [`₹${value}`, 'Revenue']}
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  backdropFilter: 'blur(8px)',
                  borderRadius: '12px',
                  border: '1px solid rgba(255,255,255,0.2)',
                  boxShadow: '0 8px 20px rgba(0,0,0,0.08)',
                  padding: '8px 12px',
                }}
                labelStyle={{ fontWeight: 'bold', color: '#1E293B' }}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#6D4AFF"
                strokeWidth={3}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="url(#colorRevenue)"
                dot={false}
                activeDot={{ r: 6, fill: '#6D4AFF', stroke: 'white', strokeWidth: 2 }}
                animationDuration={1400}
                animationEasing="ease-out"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Outlet Performance Table */}
      {outletComparison.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-neutral-800 mb-4">🏆 Outlet Highlights</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Top Revenue Card */}
            <div className="bg-gradient-to-br from-emerald-50/80 to-emerald-100/50 backdrop-blur-sm rounded-xl border border-white/20 shadow-soft p-5 transition-all hover:shadow-hover">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">🏆</span>
                <h4 className="font-semibold text-neutral-700">Top Revenue</h4>
              </div>
              <p className="text-2xl font-bold text-emerald-600">
                ₹{Math.max(...outletComparison.map(o => o.revenue)).toFixed(0)}
              </p>
              <p className="text-sm text-neutral-500 mt-1">
                {outletComparison.find(o => o.revenue === Math.max(...outletComparison.map(o => o.revenue)))?.name}
              </p>
            </div>

            {/* Highest AOV Card */}
            <div className="bg-gradient-to-br from-purple-50/80 to-purple-100/50 backdrop-blur-sm rounded-xl border border-white/20 shadow-soft p-5 transition-all hover:shadow-hover">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">⚡</span>
                <h4 className="font-semibold text-neutral-700">Highest AOV</h4>
              </div>
              <p className="text-2xl font-bold text-purple-600">
                ₹{Math.max(...outletComparison.map(o => o.avgOrderValue)).toFixed(0)}
              </p>
              <p className="text-sm text-neutral-500 mt-1">
                {outletComparison.find(o => o.avgOrderValue === Math.max(...outletComparison.map(o => o.avgOrderValue)))?.name}
              </p>
            </div>

            {/* Most Orders Card */}
            <div className="bg-gradient-to-br from-orange-50/80 to-orange-100/50 backdrop-blur-sm rounded-xl border border-white/20 shadow-soft p-5 transition-all hover:shadow-hover">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">📦</span>
                <h4 className="font-semibold text-neutral-700">Most Orders</h4>
              </div>
              <p className="text-2xl font-bold text-orange-600">
                {Math.max(...outletComparison.map(o => o.orderCount))}
              </p>
              <p className="text-sm text-neutral-500 mt-1">
                {outletComparison.find(o => o.orderCount === Math.max(...outletComparison.map(o => o.orderCount)))?.name}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search outlets..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full max-w-md px-4 py-2 rounded-xl border border-neutral-200 bg-white/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
        />
      </div>
      
      {/* Outlet Cards */}
      <div className="flex items-center justify-between mt-8 mb-4">
        <div>
          <h2 className="text-2xl font-bold text-neutral-800">My Outlets</h2>
          <p className="text-neutral-500 text-sm">{filteredOutlets.length} outlets</p>
        </div>
        <button onClick={() => navigate('/owner/outlets/create')} className="px-4 py-2 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition shadow-soft">+ Add Outlet</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredOutlets.map(out => {
          const outletStats = outletComparison.find(o => o.id === out.id);
          const cancelledCount = summary?.cancellationsByOutlet?.find(c => c.outletId === out.id)?.cancelledCount || 0;
          return (
            <div key={out.id} className="bg-white/80 backdrop-blur-sm rounded-xl border-l-4 border-primary-500 shadow-soft p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
              {/* Header: Outlet name + health badge */}
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold text-neutral-800">{out.name}</h3>
                  <p className="text-xs text-neutral-400 mt-0.5">{out.outlet_type}</p>
                </div>
                {outletStats ? (
                  outletStats.pendingOrders > 0 ? (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-orange-700 bg-orange-100 px-2 py-1 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" /> ⚠ Delayed
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> 🟢 Healthy
                    </span>
                  )
                ) : (
                  <span className="text-xs text-neutral-400 bg-neutral-100 px-2 py-1 rounded-full">Inactive</span>
                )}
              </div>

              {outletStats ? (
                <div className="mt-4 space-y-3">
                  {/* Revenue progress bar */}
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-neutral-600">Revenue</span>
                      <span className="font-semibold text-emerald-600">₹{Number(outletStats.revenue).toFixed(0)}</span>
                    </div>
                    <div className="w-full bg-neutral-200 rounded-full h-2">
                      <div
                        className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${(outletStats.revenue / maxRevenue) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Orders progress bar */}
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-neutral-600">Orders</span>
                      <span className="font-semibold text-primary-600">{outletStats.orderCount}</span>
                    </div>
                    <div className="w-full bg-neutral-200 rounded-full h-2">
                      <div
                        className="bg-primary-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${(outletStats.orderCount / maxOrders) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Avg Order and Pending as separate rows */}
                  <div className="flex justify-between items-baseline pt-1 text-sm">
                    <div>
                      <span className="text-neutral-500">Avg Order</span>
                      <p className="text-base font-semibold text-purple-600 mt-1">₹{Number(outletStats.avgOrderValue).toFixed(0)}</p>
                    </div>
                    <div>
                      <span className="text-neutral-500">Pending</span>
                      <p className={`text-base font-semibold mt-1 ${outletStats.pendingOrders > 0 ? 'text-orange-600' : 'text-neutral-400'}`}>
                        {outletStats.pendingOrders}
                      </p>
                    </div>

                    <div>
                      <span className="text-xs text-neutral-500">Cancelled</span>
                      <p className={`text-sm font-semibold ${cancelledCount > 0 ? 'text-red-600' : 'text-neutral-400'}`}>
                        {cancelledCount}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-neutral-400 text-sm mt-4">No orders today</p>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 mt-5">
                <button onClick={() => navigate(`/owner/menu?outlet=${out.id}`)} className="flex-1 px-3 py-1.5 bg-neutral-100 text-neutral-700 rounded-lg text-sm font-medium hover:bg-neutral-200 transition">Menu</button>
                <button onClick={() => navigate(`/owner/managers?outlet=${out.id}`)} className="flex-1 px-3 py-1.5 bg-neutral-100 text-neutral-700 rounded-lg text-sm font-medium hover:bg-neutral-200 transition">Add Users</button>
                <button onClick={() => navigate(`/owner/outlet-analytics?outlet=${out.id}`)} className="flex-1 px-3 py-1.5 bg-primary-50 text-primary-600 rounded-lg text-sm font-medium hover:bg-primary-100 transition">Analytics</button>
              </div>
            </div>
          );
        })}
        {filteredOutlets.length === 0 && <div className="text-center text-neutral-400 py-16 col-span-2">No outlets match your search.</div>}
      </div>

      {/* Quick Insights Strip */}
      {insights.length > 0 && (
        <div>
          <SectionHeader
            title="Quick Insights"
            description="Key operational observations" />
          <div className="grid md:grid-cols-3 gap-4">

            {insights.map((insight, index) => (
              <InsightCard
                key={index}
                title={insight.title}
                value={insight.value}
              />
            ))}

          </div>
          {/* <div className="flex flex-wrap gap-3">
            {insights.map((insight, idx) => (
              <span key={idx} className="text-sm text-primary-800 bg-white/60 px-3 py-1.5 rounded-full backdrop-blur-sm transition hover:bg-white/80">
                {insight}
              </span>
            ))}
          </div> */}
        </div>
      )}

      {/* Payment Methods + Top Items */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-white/20 shadow-[0_8px_30px_rgba(109,40,217,0.06)] p-5">
          <h3 className="font-semibold text-neutral-800 mb-4 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-primary-500" /> Payment Methods
          </h3>
          <div className="space-y-4">
            {paymentBars.length > 0 ? (
              paymentBars.map(p => (
                <div key={p.payment_method}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{p.payment_method}</span>
                    <span>₹{Number(p.total).toFixed(0)}</span>
                  </div>
                  <div className="w-full bg-neutral-200 rounded-full h-2">
                    <div
                      className="bg-primary-500 h-2 rounded-full transition-all duration-700 ease-out"
                      style={{ width: `${p.percent}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-neutral-400 text-sm">No payment data</p>
            )}
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-white/20 shadow-[0_8px_30px_rgba(109,40,217,0.06)] p-5">
          <h3 className="font-semibold text-neutral-800 mb-4 flex items-center gap-2">
            <Coffee className="w-4 h-4 text-primary-500" /> Top Selling Items
          </h3>
          <div className="space-y-4">
            {topItems.length > 0 ? (
              topItems.map(item => (
                <div key={item.item_name}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">{item.item_name}</span>
                    <span className="text-neutral-500">{item.total_qty} sold · ₹{item.revenue}</span>
                  </div>
                  <div className="w-full bg-neutral-200 rounded-full h-2">
                    <div
                      className="bg-emerald-500 h-2 rounded-full transition-all duration-700 ease-out"
                      style={{ width: `${item.percent}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-neutral-400 text-sm">No orders yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Operational Pipeline */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-red-50/70 backdrop-blur-sm rounded-xl p-4 border border-red-100 transition-all hover:shadow-md">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-sm font-medium text-red-700">New</span>
          </div>
          <p className="text-2xl font-bold text-red-800 mt-2">{summary?.orderStatus?.NEW || 0}</p>
        </div>
        <div className="bg-yellow-50/70 backdrop-blur-sm rounded-xl p-4 border border-yellow-100 transition-all hover:shadow-md">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-yellow-600" />
            <span className="text-sm font-medium text-yellow-700">Preparing</span>
          </div>
          <p className="text-2xl font-bold text-yellow-800 mt-2">{summary?.orderStatus?.PREPARING || 0}</p>
        </div>
        <div className="bg-green-50/70 backdrop-blur-sm rounded-xl p-4 border border-green-100 transition-all hover:shadow-md">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-green-700">Ready</span>
          </div>
          <p className="text-2xl font-bold text-green-800 mt-2">{summary?.orderStatus?.READY || 0}</p>
        </div>
        <div className="bg-blue-50/70 backdrop-blur-sm rounded-xl p-4 border border-blue-100 transition-all hover:shadow-md">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-700">Completed</span>
          </div>
          <p className="text-2xl font-bold text-blue-800 mt-2">{summary?.orderStatus?.COMPLETED || 0}</p>
        </div>
      </div>

      <SectionHeader
        title="Revenue Performance"
        description="Revenue trends across the organization"
      />
      {/* Charts */}
      {!chartsLoading && (revenueData.length > 0 || sourceData.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-white/20 shadow-[0_8px_30px_rgba(109,40,217,0.06)] p-5">
            <h3 className="font-semibold text-neutral-800 mb-4 flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-primary-500" /> Orders by Source
            </h3>
            <div className="space-y-4">
              {sourceData.length > 0 ? (
                sourceData.map((source, idx) => {
                  const total = sourceData.reduce((sum, s) => sum + s.value, 0);
                  const percent = (source.value / total) * 100;
                  const barColor = ['#6D4AFF', '#F59E0B', '#22C55E', '#EF4444'][idx % 4];
                  return (
                    <div key={source.name}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium text-neutral-700">{source.name}</span>
                        <span className="text-neutral-500">{source.value} order{source.value !== 1 ? 's' : ''} ({percent.toFixed(0)}%)</span>
                      </div>
                      <div className="w-full bg-neutral-200 rounded-full h-2">
                        <div
                          className="h-2 rounded-full transition-all duration-700 ease-out"
                          style={{ width: `${percent}%`, backgroundColor: barColor }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-neutral-400 text-sm">No order source data</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}