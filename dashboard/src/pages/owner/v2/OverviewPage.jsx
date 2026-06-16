import { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../../store/authStore';
import { apiService } from '../../../services/api';
import { getTenantContext } from '../../../utils/tenantContext';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtFull(n) {
  const v = parseFloat(n);
  if (!v || isNaN(v)) return '₹0';
  return '₹' + v.toLocaleString('en-IN', { maximumFractionDigits: 0 });
}
function safeNum(n, fallback = 0) {
  const v = parseFloat(n);
  return isNaN(v) ? fallback : v;
}
function todayLabel() {
  return new Date().toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}
function greetingWord() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}
function formatUpdated(d) {
  if (!d) return '';
  const s = Math.floor((Date.now() - new Date(d)) / 1000);
  if (s < 60) return `Updated ${s}s ago`;
  if (s < 3600) return `Updated ${Math.floor(s / 60)}m ago`;
  return `Updated ${Math.floor(s / 3600)}h ago`;
}

// ─── Period filter ────────────────────────────────────────────────────────────
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
          className={`px-3 py-1 text-xs rounded-md font-medium transition ${period === o.k
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

// ─── Attention alerts ─────────────────────────────────────────────────────────
function Alerts({ outlets, statusCounts, revToday, period }) {
  const alerts = useMemo(() => {
    const list = [];
    const inactive = outlets.filter(o => safeNum(o.revenue) === 0);
    // Only show zero-revenue alert if at least 3 outlets are inactive,
    // or they represent more than 60% of all outlets (and only for non-today periods)
    const inactiveCount = inactive.length;
    const totalOutlets = outlets.length;
    const showInactiveAlert =
      period !== 'today' ||
      inactiveCount >= 3 ||
      (totalOutlets > 0 && inactiveCount / totalOutlets > 0.6);

    if (inactiveCount > 0 && showInactiveAlert) {
      list.push({
        type: 'amber',
        text: `${inactiveCount} outlet${inactiveCount > 1 ? 's' : ''} with zero revenue — ${inactive
          .slice(0, 3)
          .map(o => o.outlet_name || o.name)
          .join(', ')}${inactiveCount > 3 ? '…' : ''}. Consider a promo.`,
      });
    }
    const prep = safeNum(statusCounts?.PREPARING);
    if (prep > 4) {
      list.push({ type: 'red', text: `${prep} orders in preparation — kitchen may be backed up. Check KDS.` });
    }
    if (safeNum(revToday) === 0 && safeNum(statusCounts?.COMPLETED) === 0) {
      list.push({ type: 'blue', text: 'No orders yet today. Outlets are live — start promoting.' });
    }
    return list;
  }, [outlets, statusCounts, revToday, period]);

  if (alerts.length === 0) return null;

  const S = {
    red: 'border-l-red-500 bg-red-50 text-red-800',
    amber: 'border-l-amber-500 bg-amber-50 text-amber-900',
    blue: 'border-l-blue-400 bg-blue-50 text-blue-900',
  };
  const I = { red: '🔴', amber: '⚠️', blue: 'ℹ️' };

  return (
    <div className="space-y-1.5 mb-4">
      {alerts.map((a, i) => (
        <div
          key={i}
          className={`border-l-2 pl-3 pr-4 py-2 rounded-r-lg text-xs leading-relaxed ${S[a.type]}`}
        >
          <span className="mr-1.5">{I[a.type]}</span>{a.text}
        </div>
      ))}
    </div>
  );
}

// ─── KPI card ─────────────────────────────────────────────────────────────────
function KpiCard({ label, value, delta, deltaUp }) {
  return (
    <div className="bg-white border border-gray-100 rounded-lg p-4">
      <div
        className="text-gray-400 font-medium uppercase tracking-wide mb-1.5"
        style={{ fontSize: 10, letterSpacing: '0.07em' }}
      >
        {label}
      </div>
      <div className="text-xl font-medium text-gray-900 tabular-nums">{value}</div>
      {delta && (
        <div
          className={`text-xs mt-1 ${deltaUp === true
              ? 'text-green-600'
              : deltaUp === false
                ? 'text-red-600'
                : 'text-gray-400'
            }`}
        >
          {delta}
        </div>
      )}
    </div>
  );
}

// ─── Status rail ──────────────────────────────────────────────────────────────
const STATUS_STYLE = {
  NEW: { dot: 'bg-red-500', text: 'text-red-600', label: 'New' },
  PREPARING: { dot: 'bg-amber-500', text: 'text-amber-700', label: 'Preparing' },
  READY: { dot: 'bg-green-600', text: 'text-green-700', label: 'Ready' },
  COMPLETED: { dot: 'bg-blue-500', text: 'text-blue-600', label: 'Completed' },
};
function StatusCell({ status, count }) {
  const s = STATUS_STYLE[status];
  return (
    <Link to={`/orders?status=${status}`}>
      <div className="bg-white border border-gray-100 rounded-lg px-4 py-3 hover:bg-gray-50 transition">
        <div className={`flex items-center gap-1.5 text-xs font-medium mb-1 ${s.text}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
          {s.label}
        </div>
        <div className="text-xl font-medium text-gray-900 tabular-nums">{count ?? 0}</div>
      </div>
    </Link>
  );
}

// ─── Sparkline ────────────────────────────────────────────────────────────────
function Sparkline({ data }) {
  if (!data || data.length < 2) {
    return (
      <div className="h-12 flex items-center justify-center text-xs text-gray-300">
        No trend available yet
      </div>
    );
  }
  const vals = data.map(d => safeNum(d.revenue));
  const max = Math.max(...vals, 1);
  const W = 260,
    H = 48;
  const pts = vals
    .map((v, i) => {
      const x = (i / (vals.length - 1)) * W;
      const y = H - (v / max) * (H - 6) - 3;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
  const lastX = pts.split(' ').pop().split(',')[0];
  const d0 = data[0]?.date
    ? new Date(data[0].date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
    : '';
  const dN = data[data.length - 1]?.date
    ? new Date(data[data.length - 1].date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
    : '';
  const validVals = vals.filter(v => v > 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-500 font-medium">Revenue trend</span>
        <span className="text-xs text-gray-400">{data.length} points</span>
      </div>
      <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
        <polyline points={pts} fill="none" stroke="#1d9e75" strokeWidth="1.5" strokeLinejoin="round" />
        <polygon points={`${pts} ${lastX},${H} 0,${H}`} fill="#1d9e75" fillOpacity="0.07" />
      </svg>
      <div className="flex justify-between text-xs text-gray-300 mt-1">
        <span>{d0}</span>
        <span>{dN}</span>
      </div>
    </div>
  );
}

// ─── Today revenue summary (when only one data point) ────────────────────────
function TodayRevenueSummary({ revenue, orders, aov }) {
  return (
    <div className="h-12 flex items-center justify-between text-sm px-1">
      <div>
        <span className="text-gray-500">Today's Revenue</span>
        <span className="ml-3 font-semibold text-gray-900">{fmtFull(revenue)}</span>
      </div>
      <div>
        <span className="text-gray-500">Orders</span>
        <span className="ml-2 font-semibold text-gray-900">{orders}</span>
      </div>
      <div>
        <span className="text-gray-500">AOV</span>
        <span className="ml-2 font-semibold text-gray-900">{aov > 0 ? fmtFull(aov) : '—'}</span>
      </div>
    </div>
  );
}

// ─── Peak hours ───────────────────────────────────────────────────────────────
function PeakBars({ data }) {
  const SLOTS = [
    { label: 'Breakfast', hours: [7, 8, 9, 10, 11] },
    { label: 'Lunch', hours: [12, 13, 14, 15] },
    { label: 'Tea', hours: [16, 17] },
    { label: 'Dinner', hours: [18, 19, 20, 21] },
    { label: 'Late Night', hours: [22, 23] },
  ];

  const hourMap = useMemo(() => {
    const m = new Map();
    (data || []).forEach(p => {
      const h = parseInt(p.hour) % 24;
      if (isNaN(h)) return;
      const c = parseInt(p.orders || p.order_count || p.count || 0);
      m.set(h, (m.get(h) || 0) + c);
    });
    return m;
  }, [data]);

  const slotData = SLOTS.map(slot => ({
    ...slot,
    total: slot.hours.reduce((sum, h) => sum + (hourMap.get(h) || 0), 0),
  }));

  const maxOrders = Math.max(...slotData.map(s => s.total), 1);
  const MAX_HEIGHT = 32;
  const MIN_HEIGHT = 4;

  return (
    <div>
      <div className="flex items-end gap-2 h-9">
        {slotData.map(slot => {
          const ratio = slot.total / maxOrders;
          const barHeight =
            maxOrders === 0 ? MIN_HEIGHT : Math.max(MIN_HEIGHT, ratio * MAX_HEIGHT);
          return (
            <div key={slot.label} className="flex-1 flex flex-col items-center">
              <div
                className="w-full rounded-t-sm bg-violet-400 transition-all"
                style={{ height: `${barHeight}px` }}
                title={`${slot.label}: ${slot.total} orders`}
              />
              <span className="text-[8px] text-gray-400 mt-1 text-center">{slot.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Outlet comparison table ──────────────────────────────────────────────────
const CHIP = {
  healthy: 'bg-green-50 text-green-700',
  attention: 'bg-amber-50 text-amber-700',
  inactive: 'bg-gray-100 text-gray-500',
};
const DOT = {
  healthy: 'bg-green-600',
  attention: 'bg-amber-500',
  inactive: 'bg-gray-400',
};

function OutletRow({ o }) {
  const rev = safeNum(o.revenue);
  const orders = safeNum(o.orders);
  const aov = safeNum(o.aov);
  const share = Math.round(safeNum(o.share || 0));
  const status = (o.healthStatus || 'Inactive').toLowerCase();
  const name = o.outletName || o.outlet_name || o.name || '—';

  return (
    <tr className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
      <td className="py-2.5 px-3">
        <span className="text-sm font-medium text-gray-800">{name}</span>
        {o.outlet_type && (
          <span className="block text-xs text-gray-400 mt-0.5">
            {(o.outlet_type || '').replace('_', ' ')}
          </span>
        )}
      </td>
      <td
        className="py-2.5 px-3 text-sm tabular-nums font-medium"
        style={{ color: rev > 0 ? '#111' : '#ccc' }}
      >
        {fmtFull(rev)}
      </td>
      <td className="py-2.5 px-3">
        <div className="flex items-center gap-1.5">
          <div className="w-12 h-1 bg-gray-100 rounded-full">
            <div className="h-1 bg-green-600 rounded-full" style={{ width: `${share}%` }} />
          </div>
          <span className="text-xs text-gray-400">{share}%</span>
        </div>
      </td>
      <td
        className="py-2.5 px-3 text-sm tabular-nums"
        style={{ color: orders > 0 ? '#111' : '#ccc' }}
      >
        {orders}
      </td>
      <td
        className="py-2.5 px-3 text-sm tabular-nums"
        style={{ color: aov > 0 ? '#111' : '#ccc' }}
      >
        {aov > 0 ? fmtFull(aov) : '—'}
      </td>
      <td className="py-2.5 px-3">
        <span
          className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${CHIP[status]
            }`}
        >
          <span className={`w-1 h-1 rounded-full ${DOT[status]}`} />
          {status === 'healthy' ? 'Healthy' : status === 'attention' ? 'Needs attention' : 'Inactive'}
        </span>
      </td>
    </tr>
  );
}

// ─── Skeleton ────────────────────────────────────────────────────────────────
function Sk({ className }) {
  return <div className={`bg-gray-100 rounded animate-pulse ${className}`} />;
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function OverviewPage() {
  const outlet = useAuthStore(s => s.outlet);
  const { organizationId } = getTenantContext(outlet);
  const ownerName = outlet?.full_name?.split(' ')[0] || outlet?.fullName?.split(' ')[0] || '';

  const [period, setPeriod] = useState('today');
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);

  const requestIdRef = useRef(0);
  const loadStartTime = useRef(null);
  const MIN_LOADING_MS = 400;

  useEffect(() => {
    if (!organizationId) return;

    const currentRequest = ++requestIdRef.current;
    loadStartTime.current = Date.now();
    setLoading(true);

    apiService
      .getBrandAnalyticsV3(period)
      .then(response => {
        // Abort if request is stale
        if (currentRequest !== requestIdRef.current) return;
        const data = response.data?.data || null;
        setAnalyticsData(data);
        setLastUpdated(new Date());
      })
      .catch(error => {
        if (currentRequest !== requestIdRef.current) return;
        console.error('Failed to load analytics:', error);
        // Optionally set error state
      })
      .finally(() => {
        if (currentRequest !== requestIdRef.current) return;
        const elapsed = Date.now() - loadStartTime.current;
        const remaining = Math.max(0, MIN_LOADING_MS - elapsed);
        setTimeout(() => {
          if (currentRequest === requestIdRef.current) {
            setLoading(false);
          }
        }, remaining);
      });
  }, [organizationId, period]);

  // ── Derived values ──────────────────────────────────────────────────────────

  const analyticsOutlets = analyticsData?.outlets || [];
  // Sort outlets by revenue descending (best performer first)
  const sortedOutlets = [...analyticsOutlets].sort((a, b) => b.revenue - a.revenue);

  const revenueTrend = analyticsData?.revenueTrend || [];
  const peakHours = analyticsData?.peakHours || [];
  const summary = analyticsData?.summary || {};

  const rev = safeNum(summary.revenue);
  const orders = safeNum(summary.orders);
  const aov = safeNum(summary.aov);
  const cancelled = safeNum(summary.cancelledOrders);
  const cancelRate = safeNum(summary.cancelRate);

  // Aggregate status counts from all outlets (brand-wide)
  const statusCounts = analyticsData?.outlets?.reduce(
    (acc, outlet) => {
      const counts = outlet.statusCounts || {};
      acc.NEW += counts.NEW || 0;
      acc.PREPARING += counts.PREPARING || 0;
      acc.READY += counts.READY || 0;
      acc.COMPLETED += counts.COMPLETED || 0;
      return acc;
    },
    { NEW: 0, PREPARING: 0, READY: 0, COMPLETED: 0 }
  ) || { NEW: 0, PREPARING: 0, READY: 0, COMPLETED: 0 };

  // Revenue delta
  let revDelta = '— No prior period',
    revDeltaUp = null;
  if (period === 'today' && revenueTrend.length >= 2) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const ystStr = yesterday.toISOString().slice(0, 10);
    const ystEntry = revenueTrend.find(d => (d.date || '').slice(0, 10) === ystStr);
    const ystRev = safeNum(ystEntry?.revenue);
    if (ystRev > 0) {
      const chg = ((rev - ystRev) / ystRev) * 100;
      revDelta = `${chg >= 0 ? '↑' : '↓'} ${Math.abs(chg).toFixed(1)}% vs yesterday`;
      revDeltaUp = chg >= 0;
    } else if (rev > 0) {
      revDelta = 'First revenue day';
      revDeltaUp = null;
    }
  } else if (period !== 'today') {
    const s = analyticsData?.summary;
    if (s && safeNum(s.prev_revenue) > 0) {
      const chg = safeNum(s.revenue_growth_pct);
      revDelta = `${chg >= 0 ? '↑' : '↓'} ${Math.abs(chg).toFixed(1)}% vs prev period`;
      revDeltaUp = chg >= 0;
    }
  }

  // Today-only cards
  const topItems = analyticsData?.topProducts || [];
  const paymentBreak = analyticsData?.paymentMethods || [];
  const sourceData = analyticsData?.orderSources || [];
  const payTotal = paymentBreak.reduce((s, p) => s + safeNum(p.revenue), 0) || 1;
  const sourceTotal = sourceData.reduce((s, d) => s + safeNum(d.orders), 0) || 1;

  const periodProducts = analyticsData?.topProducts || [];
  const periodLabel = { today: 'Today', '7d': 'Last 7 days', '30d': 'Last 30 days' }[period];

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="bg-gray-50 min-h-screen p-6">
      <div className="max-w-screen-xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-xl font-medium text-gray-900">
              {greetingWord()}
              {ownerName ? `, ${ownerName}` : ''}
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              {todayLabel()}
              {lastUpdated && <span> · {formatUpdated(lastUpdated)}</span>}
            </p>
          </div>
          <FilterBar period={period} onChange={setPeriod} />
        </div>

        {/* Attention center — today only, hide while loading */}
        {period === 'today' && !loading && (
          <Alerts outlets={analyticsOutlets} statusCounts={statusCounts} revToday={rev} period={period} />
        )}

        {/* KPI row */}
        <div className="grid grid-cols-4 gap-2.5 mb-3">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => <Sk key={i} className="h-20" />)
          ) : (
            <>
              <KpiCard label="Revenue" value={fmtFull(rev)} delta={revDelta} deltaUp={revDeltaUp} />
              <KpiCard
                label={period === 'today' ? 'Orders received' : 'Orders'}
                value={orders}
                delta={orders === 0 ? '— No orders yet' : '— New · no prior period'}
              />
              <KpiCard
                label="Avg order value"
                value={aov > 0 ? fmtFull(aov) : '₹0'}
                delta={aov > 0 ? `${fmtFull(aov)} per order` : '—'}
              />
              <KpiCard
                label="Cancellation rate"
                value={orders > 0 ? `${cancelRate.toFixed(1)}%` : '0.0%'}
                delta={orders > 0 ? `${cancelled} of ${orders} cancelled` : '—'}
              />
            </>
          )}
        </div>

        {/* Order status rail — today only */}
        {period === 'today' && (
          <div className="grid grid-cols-4 gap-2.5 mb-4">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => <Sk key={i} className="h-14" />)
            ) : (
              ['NEW', 'PREPARING', 'READY', 'COMPLETED'].map(s => (
                <StatusCell key={s} status={s} count={statusCounts?.[s]} />
              ))
            )}
          </div>
        )}

        {/* Outlet comparison + right column */}
        <div className="grid gap-3 mb-4" style={{ gridTemplateColumns: '1.65fr 1fr' }}>
          {/* Outlet table */}
          <div className="bg-white border border-gray-100 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-800">Outlet comparison</span>
              <span className="text-xs text-gray-400">{periodLabel}</span>
            </div>
            {loading ? (
              <Sk className="h-64" />
            ) : sortedOutlets.length === 0 ? (
              <div className="py-8 text-center text-xs text-gray-300">No outlet data for this period.</div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr>
                    {['Outlet', 'Revenue', 'Share', 'Orders', 'AOV', 'Status'].map(h => (
                      <th
                        key={h}
                        className="text-left pb-2 text-gray-400 font-medium"
                        style={{ fontSize: 10, letterSpacing: '0.05em', textTransform: 'uppercase' }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedOutlets.map((o, i) => (
                    <OutletRow key={o.outlet_id || i} o={o} />
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-3">
            <div className="bg-white border border-gray-100 rounded-lg p-4">
              {loading ? (
                <Sk className="h-32" />
              ) : period === 'today' && revenueTrend.length === 1 ? (
                <TodayRevenueSummary revenue={rev} orders={orders} aov={aov} />
              ) : (
                <Sparkline data={revenueTrend} />
              )}
            </div>
            <div className="bg-white border border-gray-100 rounded-lg p-4">
              {loading ? (
                <Sk className="h-32" />
              ) : (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-800">Peak hours</span>
                    <span className="text-xs text-gray-400">by hour</span>
                  </div>
                  <PeakBars data={peakHours} />
                </>
              )}
            </div>
          </div>
        </div>

        {/* Today-only: Payment + Top Items + Source */}
        {period === 'today' && (
          <div className="grid grid-cols-3 gap-3 mb-4">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => <Sk key={i} className="h-32" />)
            ) : (
              <>
                {/* Payment methods */}
                <div className="bg-white border border-gray-100 rounded-lg p-4">
                  <span className="text-sm font-medium text-gray-800 block mb-3">
                    Payment methods
                  </span>
                  {paymentBreak.length > 0 ? (
                    <div className="space-y-3">
                      {paymentBreak.map(p => (
                        <div key={p.method}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-gray-600">{p.method}</span>
                            <span className="text-gray-500 tabular-nums">{fmtFull(p.revenue)}</span>
                          </div>
                          <div className="w-full h-1.5 bg-gray-100 rounded-full">
                            <div
                              className="h-1.5 bg-indigo-500 rounded-full"
                              style={{ width: `${(safeNum(p.revenue) / payTotal) * 100}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-gray-300 text-center py-6">
                      Appears after first successful transaction
                    </div>
                  )}
                </div>

                {/* Top selling items */}
                <div className="bg-white border border-gray-100 rounded-lg p-4">
                  <span className="text-sm font-medium text-gray-800 block mb-3">
                    Top selling items
                  </span>
                  {topItems.length > 0 ? (
                    <div className="space-y-2.5">
                      {topItems.slice(0, 5).map(item => {
                        const itemRev = safeNum(item.revenue);
                        const w = rev > 0 ? Math.round((itemRev / rev) * 100) : 0;
                        return (
                          <div key={item.name}>
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-gray-600 truncate">{item.name}</span>
                              <span className="text-gray-400 tabular-nums shrink-0 ml-2">
                                {item.quantity} · {fmtFull(itemRev)}
                              </span>
                            </div>
                            <div className="w-full h-1.5 bg-gray-100 rounded-full">
                              <div
                                className="h-1.5 bg-emerald-500 rounded-full"
                                style={{ width: `${w}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-xs text-gray-300 text-center py-6">
                      Appears after completed orders
                    </div>
                  )}
                </div>

                {/* Orders by source */}
                <div className="bg-white border border-gray-100 rounded-lg p-4">
                  <span className="text-sm font-medium text-gray-800 block mb-3">
                    Orders by source
                  </span>
                  {sourceData.length > 0 ? (
                    <div className="space-y-3">
                      {sourceData.map((s, i) => {
                        const pct = (safeNum(s.orders) / sourceTotal) * 100;
                        const colors = [
                          'bg-violet-500',
                          'bg-amber-400',
                          'bg-emerald-500',
                          'bg-blue-400',
                        ];
                        return (
                          <div key={s.source || i}>
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-gray-600">{s.source}</span>
                              <span className="text-gray-400">
                                {s.orders} ({pct.toFixed(0)}%)
                              </span>
                            </div>
                            <div className="w-full h-1.5 bg-gray-100 rounded-full">
                              <div
                                className={`h-1.5 rounded-full ${colors[i % 4]}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-xs text-gray-300 text-center py-6">No source data yet</div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* 7D/30D top products from analytics */}
        {period !== 'today' && periodProducts.length > 0 && (
          <div className="bg-white border border-gray-100 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-800">Top products</span>
              <span className="text-xs text-gray-400">by revenue</span>
            </div>
            <div className="space-y-2">
              {periodProducts.slice(0, 5).map((p, i) => {
                const pRev = safeNum(p.revenue);
                const maxPRev = Math.max(...periodProducts.map(x => safeNum(x.revenue)), 1);
                const w = Math.round((pRev / maxPRev) * 100);
                return (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 truncate w-28 shrink-0">
                      {p.product_name || p.name || 'Item'}
                    </span>
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full">
                      <div className="h-1.5 bg-emerald-500 rounded-full" style={{ width: `${w}%` }} />
                    </div>
                    <span className="text-xs text-gray-400 w-14 text-right tabular-nums shrink-0">
                      {fmtFull(pRev)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}