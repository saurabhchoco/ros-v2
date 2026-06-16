// dashboard/src/pages/owner/v2/PerformancePage.jsx
import { useState, useEffect, useMemo, useRef } from 'react';
import { useAuthStore } from '../../../store/authStore';
import { apiService } from '../../../services/api';
import { getTenantContext } from '../../../utils/tenantContext';
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, BarChart, Bar, CartesianGrid, PieChart, Pie, Cell,
} from 'recharts';
import {
  TrendingUp, TrendingDown, Award, AlertTriangle, CheckCircle,
  Activity, Clock, Package, ShoppingBag, Coffee, BarChart3,
} from 'lucide-react';
// ─── NEW IMPORT ──────────────────────────────────────────────────────────────
import { BrandStatusChip } from '../../../components/BrandStatusChip';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtFull(n) {
  const v = parseFloat(n);
  if (!v || isNaN(v)) return '₹0';
  return '₹' + v.toLocaleString('en-IN', { maximumFractionDigits: 0 });
}
function fmtShort(n) {
  const v = parseFloat(n);
  if (!v || isNaN(v)) return '₹0';
  if (v >= 100000) return '₹' + (v / 100000).toFixed(1) + 'L';
  if (v >= 1000) return '₹' + (v / 1000).toFixed(1) + 'K';
  return '₹' + v.toFixed(0);
}
function safeNum(n) {
  const v = parseFloat(n);
  return isNaN(v) ? 0 : v;
}
function safePct(n) {
  const v = parseFloat(n);
  return isNaN(v) ? '0.0%' : v.toFixed(1) + '%';
}

// ─── NEW: Outlet name helper ──────────────────────────────────────────────
function getOutletName(outlet) {
  if (!outlet) return 'Unnamed Outlet';
  return outlet.outletName || outlet.outlet_name || outlet.name || 'Outlet';
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function Card({ children, className = '' }) {
  return <div className={`bg-white border border-gray-100 rounded-lg p-4 ${className}`}>{children}</div>;
}

function CardHeader({ title, sub }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <span className="text-sm font-medium text-gray-800">{title}</span>
      {sub && <span className="text-xs text-gray-400">{sub}</span>}
    </div>
  );
}

function Skeleton({ className }) {
  return <div className={`bg-gray-100 rounded animate-pulse ${className}`} />;
}

// ─── Period filter ──────────────────────────────────────────────────────────
function FilterBar({ period, onChange }) {
  const opts = [
    { k: 'today', l: 'Today' },
    { k: '7d', l: '7D' },
    { k: '30d', l: '30D' },
  ];
  return (
    <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
      {opts.map(o => (
        <button
          key={o.k}
          onClick={() => onChange(o.k)}
          className={`px-3 py-1 text-xs rounded-md font-medium transition ${
            period === o.k
              ? 'bg-white shadow text-gray-900'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {o.l}
        </button>
      ))}
    </div>
  );
}

// ─── KPI with delta ───────────────────────────────────────────────────────────
// FIXED: DeltaBadge now returns null when growthPct is invalid
function DeltaBadge({ growthPct, prevVal }) {
  // If growthPct is null/undefined/NaN, don't render anything
  if (growthPct == null || isNaN(safeNum(growthPct))) {
    return null;
  }
  // Now we have a valid numeric growthPct
  const g = safeNum(growthPct);
  // If previous period doesn't exist or revenue was zero, show "New"
  if (!prevVal || safeNum(prevVal) === 0) {
    return <span className="text-xs text-gray-400">— New · no prior period</span>;
  }
  if (g === 0) {
    return <span className="text-xs text-gray-400">Flat vs prev period</span>;
  }
  return (
    <span className={`text-xs font-medium ${g > 0 ? 'text-green-600' : 'text-red-600'}`}>
      {g > 0 ? '↑' : '↓'} {Math.abs(g).toFixed(1)}%
      <span className="text-gray-400 font-normal ml-1">vs prev period</span>
    </span>
  );
}

function KpiCard({ label, value, growthPct, prevVal, icon: Icon, severity, severityLabel }) {
  // For cancellation, add severity context
  const severityColors = {
    good: 'text-green-600',
    watch: 'text-amber-600',
    critical: 'text-red-600',
  };
  const severityColor = severity ? severityColors[severity] : '';

  return (
    <Card>
      <div className="flex items-center gap-2 text-gray-400 mb-1.5">
        {Icon && <Icon className="h-3.5 w-3.5" />}
        <span className="font-medium uppercase tracking-wide" style={{ fontSize: 10, letterSpacing: '0.07em' }}>
          {label}
        </span>
      </div>
      <div className={`text-xl font-medium tabular-nums mb-1 ${severityColor}`}>{value}</div>
      {growthPct !== undefined && <DeltaBadge growthPct={growthPct} prevVal={prevVal} />}
      {severity && severityLabel && <div className="text-xs text-gray-400 mt-1">{severityLabel}</div>}
    </Card>
  );
}

// ─── Revenue trend chart ──────────────────────────────────────────────────────
function RevenueTrend({ data, period }) {
  const periodLabel = { today: 'Today', '7d': 'Last 7 days', '30d': 'Last 30 days' }[period] || '7 days';

  if (!data || data.length < 2) {
    return (
      <div className="h-44 flex flex-col items-center justify-center">
        <div className="text-xs text-gray-300 text-center leading-relaxed">
          Revenue trend needs at least 2 data points.<br />
          {data?.length === 1
            ? 'One day found — keep collecting orders.'
            : 'No data yet for this period.'}
        </div>
      </div>
    );
  }

  const formatted = data.map(d => ({
    ...d,
    dateLabel: new Date(d.date || d.created_at).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short',
    }),
    revenue: safeNum(d.revenue),
  }));

  const maxDay = formatted.reduce((a, b) => a.revenue > b.revenue ? a : b, formatted[0]);
  const minDay = formatted.reduce((a, b) => a.revenue < b.revenue ? a : b, formatted[0]);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3 text-xs text-gray-500">
        <div>
          <span className="font-medium">Revenue trend</span>
          <span className="text-gray-400 ml-2">{periodLabel}</span>
        </div>
        <div className="flex gap-3">
          <span>Highest: <span className="font-medium">{fmtFull(maxDay.revenue)}</span> ({maxDay.dateLabel})</span>
          <span>Lowest: <span className="font-medium">{fmtFull(minDay.revenue)}</span> ({minDay.dateLabel})</span>
        </div>
      </div>
      <div className="h-44">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={formatted} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="2 2" stroke="#f0f0f0" vertical={false} />
            <XAxis
              dataKey="dateLabel"
              tick={{ fontSize: 9, fill: '#ccc' }}
              axisLine={false}
              tickLine={false}
              interval={Math.max(0, Math.floor(formatted.length / 10))}
            />
            <YAxis
              tickFormatter={v => fmtShort(v)}
              tick={{ fontSize: 9, fill: '#ccc' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              formatter={v => [fmtFull(v), 'Revenue']}
              contentStyle={{
                fontSize: 11,
                border: '0.5px solid #eee',
                borderRadius: 6,
                boxShadow: 'none',
              }}
            />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#4f46e5"
              strokeWidth={2}
              dot={{ r: 2.5, fill: '#4f46e5', strokeWidth: 0 }}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─── Outlet ranking ───────────────────────────────────────────────────────────
function OutletRanking({ outlets, brandTotal }) {
  if (!outlets || outlets.length === 0) {
    return <div className="text-xs text-gray-300 text-center py-6">No outlet data for this period.</div>;
  }
  const sorted = [...outlets].sort((a, b) => safeNum(b.revenue) - safeNum(a.revenue));
  const totalRev = safeNum(brandTotal) || outlets.reduce((s, o) => s + safeNum(o.revenue), 0) || 1;
  return (
    <div>
      {sorted.map((o, i) => {
        const rev = safeNum(o.revenue);
        const orders = safeNum(o.orders);
        const share = (rev / totalRev) * 100;
        const name = getOutletName(o); // ← using helper
        return (
          <div key={i} className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0">
            <span className="text-xs font-medium text-gray-400 w-5 shrink-0">#{i + 1}</span>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-800 truncate">{name}</div>
              <div className="flex items-center gap-2 mt-0.5">
                <div className="w-16 h-1 bg-gray-100 rounded-full">
                  <div
                    className={`h-1 rounded-full ${i === 0 ? 'bg-emerald-600' : i === 1 ? 'bg-emerald-400' : 'bg-gray-300'}`}
                    style={{ width: `${share}%` }}
                  />
                </div>
                <span className="text-xs text-gray-400">{share.toFixed(0)}%</span>
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className={`text-sm font-medium tabular-nums ${rev > 0 ? 'text-gray-900' : 'text-gray-300'}`}>
                {fmtFull(rev)}
              </div>
              <div className="text-xs text-gray-400">{orders} orders</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Category performance ─────────────────────────────────────────────────────
function CategoryPerformance({ categories }) {
  const aggregated = useMemo(() => {
    const map = new Map();
    (categories || []).forEach(c => {
      const name = c.category_name || c.name || '—';
      const rev = safeNum(c.revenue);
      const orderCount = safeNum(c.order_count);
      if (map.has(name)) {
        const existing = map.get(name);
        map.set(name, {
          revenue: existing.revenue + rev,
          order_count: existing.order_count + orderCount,
        });
      } else {
        map.set(name, { revenue: rev, order_count: orderCount });
      }
    });
    return Array.from(map.entries()).map(([name, data]) => ({ name, ...data }));
  }, [categories]);

  if (aggregated.length === 0) {
    return (
      <div className="text-xs text-gray-300 text-center py-6 leading-relaxed">
        Category data will appear after menu items are mapped to categories.
      </div>
    );
  }

  const total = aggregated.reduce((s, c) => s + c.revenue, 0) || 1;
  const sorted = aggregated.sort((a, b) => b.revenue - a.revenue).slice(0, 7);

  return (
    <div className="space-y-2.5">
      {sorted.map((c, i) => {
        const pct = (c.revenue / total) * 100;
        // ─── NEW: Show order count alongside revenue ──────────────────────
        return (
          <div key={i}>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-600 truncate">{c.name}</span>
              <span className="text-gray-400 tabular-nums">
                {fmtFull(c.revenue)} ({pct.toFixed(0)}%)
                <span className="text-gray-300 ml-1">· {c.order_count} orders</span>
              </span>
            </div>
            <div className="w-full h-1.5 bg-gray-100 rounded-full">
              <div className="h-1.5 bg-violet-400 rounded-full" style={{ width: `${pct}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Top products ─────────────────────────────────────────────────────────────
function TopProducts({ products }) {
  if (!products || products.length === 0) {
    return (
      <div className="text-xs text-gray-300 text-center py-6 leading-relaxed">
        📊 Top products appear after completed orders.<br />
        Revenue contribution will show here.
      </div>
    );
  }
  const maxRev = Math.max(...products.map(p => safeNum(p.revenue)), 1);
  return (
    <div className="space-y-2.5">
      {products.slice(0, 5).map((p, i) => {
        const rev = safeNum(p.revenue);
        const qty = safeNum(p.quantity_sold || p.quantity);
        const name = p.product_name || p.name || p.item_name || 'Item';
        const w = Math.round((rev / maxRev) * 100);
        return (
          <div key={i} className="flex items-center gap-2">
            <span className="text-xs text-gray-400 w-4 shrink-0">#{i + 1}</span>
            <span className="text-xs text-gray-700 truncate w-28 shrink-0">{name}</span>
            <div className="flex-1 h-1.5 bg-gray-100 rounded-full">
              <div className="h-1.5 bg-emerald-500 rounded-full" style={{ width: `${w}%` }} />
            </div>
            <div className="text-right shrink-0">
              <span className="text-xs font-medium text-gray-700 tabular-nums">{fmtShort(rev)}</span>
              {qty > 0 && <span className="text-xs text-gray-400 ml-1">({qty})</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Peak hours ──────────────────────────────────────────────────────────────
function PeakHours({ data }) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    const m = new Map();
    data.forEach(p => {
      const h = parseInt(p.hour);
      if (isNaN(h)) return;
      const c = parseInt(p.orders || p.order_count || p.count || 0);
      m.set(h % 24, (m.get(h % 24) || 0) + c);
    });
    return [...m.entries()]
      .sort(([a], [b]) => a - b)
      .filter(([, c]) => c > 0)
      .map(([h, c]) => ({
        label: h < 12 ? `${h} AM` : h === 12 ? '12 PM' : `${h - 12} PM`,
        count: c,
      }));
  }, [data]);

  // ─── CHANGED: Now called "Peak Hour" (single max hour) ──────────────────
  const peakInfo = useMemo(() => {
    if (chartData.length === 0) return null;
    const maxCount = Math.max(...chartData.map(d => d.count));
    const peakEntries = chartData.filter(d => d.count === maxCount);
    if (peakEntries.length === 0) return null;
    const totalOrders = chartData.reduce((s, d) => s + d.count, 0);
    // Take the first peak hour (if multiple, we show the first one)
    const peak = peakEntries[0];
    return {
      label: peak.label,
      count: maxCount,
      total: totalOrders,
      percentage: (maxCount / totalOrders) * 100,
    };
  }, [chartData]);

  if (chartData.length === 0) {
    return <div className="h-32 flex items-center justify-center text-xs text-gray-300">No peak data available for this period.</div>;
  }

  return (
    <div>
      {peakInfo && (
        <div className="text-xs text-gray-600 mb-2">
          <span className="font-medium">Peak Hour</span>{' '}
          {peakInfo.label} · {peakInfo.count} orders ({peakInfo.percentage.toFixed(0)}% of all)
        </div>
      )}
      <div className="h-32">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 4, right: 0, left: -24, bottom: 0 }}>
            <CartesianGrid strokeDasharray="2 2" stroke="#f0f0f0" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 8, fill: '#ccc' }}
              axisLine={false}
              tickLine={false}
              interval={0}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 8, fill: '#ccc' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              formatter={v => [`${v} orders`, 'Orders']}
              contentStyle={{ fontSize: 11, border: '0.5px solid #eee', borderRadius: 6, boxShadow: 'none' }}
            />
            <Bar
              dataKey="count"
              radius={[2, 2, 0, 0]}
              fill="#c4b5fd"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─── Brand Health Card ──────────────────────────────────────────────────────
function BrandHealth({ summary, outlets }) {
  const rev = safeNum(summary.revenue);
  const orders = safeNum(summary.orders);
  const cancelRate = safeNum(summary.cancelRate);
  const healthyCount = outlets.filter(o => o.healthStatus === 'Healthy').length;
  const totalOutlets = outlets.length || 1;

  const revGrowth = safeNum(summary.revenue_growth_pct);
  const orderGrowth = safeNum(summary.orders_growth_pct);

  return (
    <Card>
      <CardHeader title="Brand Health" />
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div>
          <span className="text-gray-500">Revenue</span>
          <div className={`font-medium ${revGrowth > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {fmtShort(rev)} {revGrowth > 0 ? '↑' : '↓'} {Math.abs(revGrowth).toFixed(0)}%
          </div>
        </div>
        <div>
          <span className="text-gray-500">Orders</span>
          <div className={`font-medium ${orderGrowth > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {orders} {orderGrowth > 0 ? '↑' : '↓'} {Math.abs(orderGrowth).toFixed(0)}%
          </div>
        </div>
        <div>
          <span className="text-gray-500">Cancellation</span>
          <div className={`font-medium ${cancelRate < 5 ? 'text-green-600' : cancelRate < 10 ? 'text-amber-600' : 'text-red-600'}`}>
            {safePct(cancelRate)}
          </div>
        </div>
        <div>
          <span className="text-gray-500">Healthy Outlets</span>
          <div className="font-medium">{healthyCount} / {totalOutlets}</div>
        </div>
      </div>
    </Card>
  );
}

// ─── Revenue Concentration (donut) ──────────────────────────────────────────
function RevenueConcentration({ outlets }) {
  if (!outlets || outlets.length === 0) return null;
  const sorted = [...outlets].sort((a, b) => safeNum(b.revenue) - safeNum(a.revenue));
  const total = outlets.reduce((s, o) => s + safeNum(o.revenue), 0) || 1;
  const top = sorted[0];
  if (!top || safeNum(top.revenue) === 0) return null;

  const topShare = (safeNum(top.revenue) / total) * 100;
  const restShare = 100 - topShare;
  const data = [
    { name: getOutletName(top), value: topShare }, // ← helper
    { name: 'Rest', value: restShare },
  ];
  const COLORS = ['#4f46e5', '#e5e7eb'];

  return (
    <Card>
      <CardHeader title="Revenue Concentration" sub={`${topShare.toFixed(0)}% in top outlet`} />
      <div className="flex items-center gap-4">
        <div className="h-24 w-24">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={28}
                outerRadius={40}
                paddingAngle={2}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="text-sm">
          <div className="font-medium">{getOutletName(top)}</div>
          <div className="text-xs text-gray-500">{topShare.toFixed(0)}% of brand revenue</div>
          <div className="text-xs text-gray-400 mt-1">{fmtFull(safeNum(top.revenue))}</div>
        </div>
      </div>
    </Card>
  );
}

// ─── Performer Cards ──────────────────────────────────────────────────────────
function PerformerCards({ outlets }) {
  if (!outlets || outlets.length === 0) return null;

  // Best: highest revenue
  const sortedByRevenue = [...outlets].filter(o => safeNum(o.revenue) > 0).sort((a, b) => safeNum(b.revenue) - safeNum(a.revenue));
  const best = sortedByRevenue[0];

  // Needs attention: highest cancellation rate OR lowest health score
  const outletsWithIssues = outlets.filter(o => {
    const cancel = safeNum(o.cancellationRate);
    const health = o.healthScore || 0;
    return cancel > 10 || health < 40 || (safeNum(o.orders) === 0 && safeNum(o.revenue) === 0);
  });

  let worst = null;
  if (outletsWithIssues.length > 0) {
    worst = outletsWithIssues.sort((a, b) => {
      const cancelA = safeNum(a.cancellationRate);
      const cancelB = safeNum(b.cancellationRate);
      if (cancelA !== cancelB) return cancelB - cancelA;
      return (a.healthScore || 0) - (b.healthScore || 0);
    })[0];
  } else if (sortedByRevenue.length > 1) {
    worst = sortedByRevenue[sortedByRevenue.length - 1];
  }

  if (!best) return null;

  const bestName = getOutletName(best);
  const worstName = worst ? getOutletName(worst) : '';

  return (
    <div className="grid grid-cols-2 gap-3 mb-3">
      <Card className="bg-green-50 border-l-4 border-emerald-500">
        <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
          <Award className="h-3.5 w-3.5 text-emerald-500" />
          <span>Top Performer</span>
        </div>
        <div className="text-base font-medium text-gray-900">{bestName}</div>
        <div className="text-xs text-gray-500 mt-1">
          {fmtFull(safeNum(best.revenue))} · {safeNum(best.orders)} orders
        </div>
        <div className="text-xs text-emerald-600 mt-1">
          {((safeNum(best.revenue) / outlets.reduce((s, o) => s + safeNum(o.revenue), 0)) * 100).toFixed(0)}% of brand
        </div>
      </Card>
      {worst && (
        <Card className="bg-amber-50 border-l-4 border-amber-500">
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
            <span>Needs Attention</span>
          </div>
          <div className="text-base font-medium text-gray-900">{worstName}</div>
          <div className="text-xs text-gray-500 mt-1">
            {safeNum(worst.orders) > 0 ? `${fmtFull(safeNum(worst.revenue))} · ${safeNum(worst.orders)} orders` : 'No orders'}
          </div>
          <div className="text-xs text-amber-600 mt-1">
            {safePct(safeNum(worst.cancellationRate))} cancellation rate
          </div>
        </Card>
      )}
    </div>
  );
}

// ─── Recommendations Block ──────────────────────────────────────────────────
function Recommendations({ summary, outlets, peakHours }) {
  const recs = useMemo(() => {
    const list = [];

    // Revenue concentration – threshold changed to 70%
    const total = outlets.reduce((s, o) => s + safeNum(o.revenue), 0) || 1;
    const top = outlets.reduce((a, b) => (safeNum(a.revenue) > safeNum(b.revenue) ? a : b), outlets[0]);
    if (top && total > 0) {
      const share = (safeNum(top.revenue) / total) * 100;
      if (share > 70) { // ← CHANGED from 50
        list.push(`Revenue concentrated in ${getOutletName(top)} (${share.toFixed(0)}%)`);
      }
    }

    // Outlets needing attention
    const attention = outlets.filter(o => {
      const cancel = safeNum(o.cancellationRate);
      const health = o.healthScore || 0;
      return cancel > 10 || health < 40 || (safeNum(o.orders) === 0 && safeNum(o.revenue) === 0);
    });
    if (attention.length > 1) {
      list.push(`${attention.length} outlets need attention – check cancellations or inactivity`);
    } else if (attention.length === 1) {
      const name = getOutletName(attention[0]);
      list.push(`${name} needs attention – high cancellation or low activity`);
    }

    // Cancellation rate above target
    const cancelRate = safeNum(summary.cancelRate);
    if (cancelRate > 5) {
      list.push(`Cancellation rate ${safePct(cancelRate)} – review order quality`);
    }

    // Peak hour insight – now uses the same "Peak Hour" concept
    if (peakHours && peakHours.length > 0) {
      const maxCount = Math.max(...peakHours.map(p => parseInt(p.orders || p.order_count || 0)));
      const peakEntries = peakHours.filter(p => parseInt(p.orders || p.order_count || 0) === maxCount);
      if (peakEntries.length > 0) {
        const peakHour = parseInt(peakEntries[0].hour) % 24;
        const label = peakHour < 12 ? `${peakHour} AM` : peakHour === 12 ? '12 PM' : `${peakHour - 12} PM`;
        const totalOrders = peakHours.reduce((s, p) => s + parseInt(p.orders || p.order_count || 0), 0);
        const pct = totalOrders > 0 ? (maxCount / totalOrders) * 100 : 0;
        if (pct > 20) {
          list.push(`Peak hour around ${label} – ${pct.toFixed(0)}% of orders`);
        }
      }
    }

    return list.slice(0, 4);
  }, [outlets, summary, peakHours]);

  if (recs.length === 0) return null;

  return (
    <Card className="mb-3 bg-blue-50 border-blue-100">
      <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
        <BarChart3 className="h-3.5 w-3.5" />
        <span className="font-medium uppercase tracking-wide" style={{ fontSize: 10, letterSpacing: '0.07em' }}>
          Recommendations
        </span>
      </div>
      <ul className="text-xs text-gray-700 space-y-1 list-disc list-inside">
        {recs.map((rec, i) => <li key={i}>{rec}</li>)}
      </ul>
    </Card>
  );
}

// ─── Insight banners ──────────────────────────────────────────────────────────
const INSIGHT_STYLE = {
  critical: 'border-l-red-400 bg-red-50 text-red-800',
  warning: 'border-l-amber-400 bg-amber-50 text-amber-900',
  success: 'border-l-green-500 bg-green-50 text-green-800',
  info: 'border-l-blue-400 bg-blue-50 text-blue-900',
};

function InsightBanners({ insights }) {
  if (!insights || insights.length === 0) return null;
  return (
    <div className="space-y-1.5 mb-4">
      {insights.map((ins, i) => {
        const style = INSIGHT_STYLE[ins.severity] || INSIGHT_STYLE.info;
        return (
          <div key={i} className={`border-l-2 pl-3 pr-4 py-2.5 rounded-r-md text-xs leading-relaxed ${style}`}>
            <div className="font-medium">{ins.title}</div>
            {ins.description && <div className="mt-0.5 opacity-80">{ins.description}</div>}
          </div>
        );
      })}
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function PerformancePage() {
  const outlet = useAuthStore(s => s.outlet);
  const { organizationId } = getTenantContext(outlet);

  const [period, setPeriod] = useState('7d');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const requestIdRef = useRef(0);
  const MIN_LOADING_MS = 400;

  useEffect(() => {
    if (!organizationId) return;
    const currentRequest = ++requestIdRef.current;
    setLoading(true);
    const loadStart = Date.now();

    apiService
      .getBrandAnalyticsV3(period)
      .then((res) => {
        if (currentRequest !== requestIdRef.current) return;
        const d = res.data?.data || null;
        setData(d);
      })
      .catch((err) => {
        if (currentRequest !== requestIdRef.current) return;
        console.error('Failed to load performance:', err);
        setError('Failed to load analytics. Please try again.');
      })
      .finally(() => {
        if (currentRequest !== requestIdRef.current) return;
        const elapsed = Date.now() - loadStart;
        const remaining = Math.max(0, MIN_LOADING_MS - elapsed);
        setTimeout(() => {
          if (currentRequest === requestIdRef.current) {
            setLoading(false);
          }
        }, remaining);
      });
  }, [organizationId, period]);

  const handlePeriodChange = (p) => setPeriod(p);

  const periodLabelMap = { today: 'Today', '7d': 'Last 7 days', '30d': 'Last 30 days' };
  const periodLabel = periodLabelMap[period] || '7 days';

  if (loading) {
    return (
      <div className="p-6 max-w-screen-xl mx-auto space-y-4">
        <div className="flex justify-between">
          <div className="space-y-2"><Skeleton className="h-6 w-48" /><Skeleton className="h-3 w-64" /></div>
          <Skeleton className="h-8 w-36" />
        </div>
        <div className="grid grid-cols-3 gap-2.5">
          {[1,2,3].map(i => <Skeleton key={i} className="h-20" />)}
        </div>
        <Skeleton className="h-60" />
        <div className="grid grid-cols-2 gap-3">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-48" />)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-screen-xl mx-auto">
        <div className="bg-red-50 border border-red-100 rounded-lg p-4 text-sm text-red-700 flex items-center justify-between">
          {error}
          <button onClick={() => {
            const currentRequest = ++requestIdRef.current;
            setLoading(true);
            setError(null);
            const loadStart = Date.now();
            apiService.getBrandAnalyticsV3(period)
              .then(res => {
                if (currentRequest !== requestIdRef.current) return;
                setData(res.data?.data || null);
              })
              .catch(() => setError('Failed again'))
              .finally(() => {
                if (currentRequest !== requestIdRef.current) return;
                const elapsed = Date.now() - loadStart;
                const remaining = Math.max(0, MIN_LOADING_MS - elapsed);
                setTimeout(() => {
                  if (currentRequest === requestIdRef.current) {
                    setLoading(false);
                  }
                }, remaining);
              });
          }} className="text-xs underline ml-4 shrink-0">
            Retry
          </button>
        </div>
      </div>
    );
  }

  const summary = data?.summary || {};
  const outlets = data?.outlets || [];
  const products = data?.topProducts || [];
  const categories = data?.categories || [];
  const peakHours = data?.peakHours || [];
  const insights = data?.insights || [];
  const revenueTrend = data?.revenueTrend || [];

  const rev = safeNum(summary.revenue);
  const orders = safeNum(summary.orders);
  const aov = safeNum(summary.aov) || (orders > 0 ? rev / orders : 0);
  const cancelRate = safeNum(summary.cancelRate);
  const totalBrandRevenue = outlets.reduce((s, o) => s + safeNum(o.revenue), 0) || 1;

  // Cancellation severity
  let cancelSeverity = '';
  let cancelSeverityLabel = '';
  if (cancelRate < 5) {
    cancelSeverity = 'good';
    cancelSeverityLabel = 'Below target (5%)';
  } else if (cancelRate < 10) {
    cancelSeverity = 'watch';
    cancelSeverityLabel = 'Above target (5%)';
  } else {
    cancelSeverity = 'critical';
    cancelSeverityLabel = 'Critical – investigate';
  }

  return (
    <div className="p-6 max-w-screen-xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-medium text-gray-900">Performance Insights</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Key metrics that drive your business · {periodLabel}
          </p>
        </div>
        <FilterBar period={period} onChange={handlePeriodChange} />
      </div>

      {/* ─── NEW: Brand Status Chip ───────────────────────────────────────── */}
      <div className="mb-4">
        <BrandStatusChip outlets={outlets} />
      </div>

      {/* Insights banners */}
      <InsightBanners insights={insights} />

      {/* Recommendations */}
      <Recommendations summary={summary} outlets={outlets} peakHours={peakHours} />

      {/* KPI row – 4 cards including Cancellation with severity */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 mb-4">
        <KpiCard
          label="Revenue"
          value={fmtFull(rev)}
          growthPct={summary.revenue_growth_pct}
          prevVal={summary.prev_revenue}
          icon={TrendingUp}
        />
        <KpiCard
          label="Orders"
          value={orders}
          growthPct={summary.orders_growth_pct}
          prevVal={summary.prev_orders}
          icon={ShoppingBag}
        />
        <KpiCard
          label="Avg Order Value"
          value={fmtFull(aov)}
          growthPct={summary.aov_growth_pct}
          prevVal={summary.prev_aov}
          icon={TrendingDown}
        />
        <KpiCard
          label="Cancellation Rate"
          value={safePct(cancelRate)}
          growthPct={null}  // No delta for cancellation
          prevVal={null}
          icon={AlertTriangle}
          severity={cancelSeverity}
          severityLabel={cancelSeverityLabel}
        />
      </div>

      {/* Brand Health + Revenue Concentration */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-3">
        <BrandHealth summary={summary} outlets={outlets} />
        <RevenueConcentration outlets={outlets} />
      </div>

      {/* Performer Cards */}
      <PerformerCards outlets={outlets} />

      {/* Revenue trend */}
      <Card className="mb-3">
        <RevenueTrend data={revenueTrend} period={period} />
      </Card>

      {/* 2×2 grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Card>
          <CardHeader title="Outlet ranking" sub="by revenue" />
          <OutletRanking outlets={outlets} brandTotal={totalBrandRevenue} />
        </Card>

        <Card>
          <CardHeader title="Category performance" sub="revenue share" />
          <CategoryPerformance categories={categories} />
        </Card>

        <Card>
          <CardHeader title="Top products" sub={products.length > 0 ? 'by revenue' : undefined} />
          <TopProducts products={products} />
        </Card>

        <Card>
          <CardHeader title="Peak hours" sub="orders by hour" />
          <PeakHours data={peakHours} />
        </Card>
      </div>
    </div>
  );
}