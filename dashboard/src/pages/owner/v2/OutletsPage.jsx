// dashboard/src/pages/owner/v2/OutletsPage.jsx
import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../store/authStore';
import { apiService } from '../../../services/api';
import { getTenantContext } from '../../../utils/tenantContext';
import {
  CheckCircle,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  AlertCircle,
  Award,
  User,
  Users,
  BarChart3,
  Coffee,
  Menu as MenuIcon,
  MoreHorizontal,
} from 'lucide-react';

// ─── Helpers ─────────────────────────────────────────────────────────────────
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

// ─── Status helpers ───────────────────────────────────────────────────────────
const STATUS_CHIP = {
  healthy: 'bg-green-50 text-green-700',
  attention: 'bg-amber-50 text-amber-700',
  critical: 'bg-red-50 text-red-700',
  inactive: 'bg-gray-100 text-gray-500',
};
const STATUS_DOT = {
  healthy: 'bg-green-600',
  attention: 'bg-amber-500',
  critical: 'bg-red-500',
  inactive: 'bg-gray-400',
};
const STATUS_LABEL = {
  healthy: 'Healthy',
  attention: 'Needs attention',
  critical: 'Critical',
  inactive: 'Inactive',
};

function getStatus(outlet) {
  if (outlet.healthStatus) {
    return outlet.healthStatus.toLowerCase();
  }
  const rev = safeNum(outlet.revenue);
  const orders = safeNum(outlet.orders);
  const cancelRate = safeNum(outlet.cancellationRate);
  if (orders === 0 && rev === 0) return 'inactive';
  if (cancelRate > 20) return 'critical';
  if (cancelRate > 10) return 'attention';
  return 'healthy';
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function StatusChip({ status, outlet }) {
  let label = STATUS_LABEL[status] || status;
  if (status === 'healthy' && outlet?.revenueGrowth) {
    label += ` +${outlet.revenueGrowth.toFixed(0)}%`;
  } else if (status === 'attention' && outlet?.cancellationRate > 15) {
    label += ` (high cancel)`;
  }
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_CHIP[status]}`}
    >
      <span className={`w-1 h-1 rounded-full ${STATUS_DOT[status]}`} />
      {label}
    </span>
  );
}

function SortButton({ label, active, dir, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`text-xs px-3 py-1.5 rounded-md border transition-all ${
        active
          ? 'bg-gray-900 text-white border-gray-900'
          : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
      }`}
    >
      {label} {active ? (dir === 'desc' ? '↓' : '↑') : '↕'}
    </button>
  );
}

function Skeleton({ className }) {
  return <div className={`bg-gray-100 rounded animate-pulse ${className}`} />;
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

// ─── Summary strip ──────────────────────────────────────────────────────────
function OutletSummary({ outlets }) {
  const totalRevenue = outlets.reduce((sum, o) => sum + safeNum(o.revenue), 0);
  const totalOrders = outlets.reduce((sum, o) => sum + safeNum(o.orders), 0);
  const healthyCount = outlets.filter(o => getStatus(o) === 'healthy').length;
  const attentionCount = outlets.filter(o => getStatus(o) === 'attention').length;
  const inactiveCount = outlets.filter(o => getStatus(o) === 'inactive').length;
  const totalOutlets = outlets.length;

  const parts = [
    `${totalOutlets} outlet${totalOutlets !== 1 ? 's' : ''}`,
    `${fmtShort(totalRevenue)} revenue`,
    `${totalOrders} order${totalOrders !== 1 ? 's' : ''}`,
  ];
  if (healthyCount > 0) parts.push(`${healthyCount} healthy`);
  if (attentionCount > 0) parts.push(`${attentionCount} needs attention`);
  if (inactiveCount > 0) parts.push(`${inactiveCount} inactive`);

  return (
    <div className="bg-white border border-gray-100 rounded-lg px-4 py-3 mb-4 text-sm text-gray-600 flex items-center gap-2 flex-wrap">
      <span className="font-medium">📊</span>
      {parts.map((part, i) => (
        <span key={i}>
          {i > 0 && <span className="text-gray-300 mx-1">·</span>}
          <span>{part}</span>
        </span>
      ))}
    </div>
  );
}

// ─── Insights bar ──────────────────────────────────────────────────────────
function InsightsBar({ outlets, period }) {
  const insights = useMemo(() => {
    const list = [];
    if (outlets.length === 0) return list;

    const sorted = [...outlets].sort((a, b) => safeNum(b.revenue) - safeNum(a.revenue));
    const top = sorted[0];
    if (top && safeNum(top.revenue) > 0) {
      const share = (safeNum(top.revenue) / outlets.reduce((s, o) => s + safeNum(o.revenue), 0)) * 100;
      list.push({ icon: Award, text: `${top.outletName} drives ${share.toFixed(0)}% of revenue`, severity: 'positive' });
    }

    const highCancel = outlets.reduce((a, b) => (safeNum(a.cancellationRate) > safeNum(b.cancellationRate) ? a : b));
    if (highCancel && safeNum(highCancel.cancellationRate) > 10) {
      list.push({ icon: AlertTriangle, text: `${highCancel.outletName} cancellation rate is ${safePct(highCancel.cancellationRate)}`, severity: 'warning' });
    }

    const inactive = outlets.filter(o => getStatus(o) === 'inactive');
    if (inactive.length > 1) {
      list.push({ icon: AlertCircle, text: `${inactive.length} outlets inactive for this period`, severity: 'warning' });
    }

    if (top && safeNum(top.revenue) > 0) {
      const share = (safeNum(top.revenue) / outlets.reduce((s, o) => s + safeNum(o.revenue), 0)) * 100;
      if (share > 50) {
        list.push({ icon: TrendingUp, text: `Revenue concentrated in one outlet (${share.toFixed(0)}%)`, severity: 'warning' });
      }
    }

    if (list.length < 3 && outlets.length > 1) {
      const avgRevenue = outlets.reduce((s, o) => s + safeNum(o.revenue), 0) / outlets.length;
      const aboveAvg = outlets.filter(o => safeNum(o.revenue) > avgRevenue * 1.2);
      if (aboveAvg.length > 0) {
        list.push({ icon: CheckCircle, text: `${aboveAvg.length} outlet(s) outperform average revenue`, severity: 'positive' });
      }
    }

    return list.slice(0, 4);
  }, [outlets]);

  if (insights.length === 0) return null;

  const severityClasses = {
    positive: 'bg-green-50 text-green-700',
    warning: 'bg-amber-50 text-amber-700',
    critical: 'bg-red-50 text-red-700',
  };

  return (
    <div className="bg-white border border-gray-100 rounded-lg px-4 py-3 mb-4 text-sm text-gray-700 flex items-center gap-4 flex-wrap">
      {insights.map((ins, i) => (
        <span key={i} className={`flex items-center gap-1 px-2 py-1 rounded ${severityClasses[ins.severity] || 'bg-gray-50'}`}>
          <ins.icon className="h-3.5 w-3.5" />
          {ins.text}
        </span>
      ))}
    </div>
  );
}

// ─── Detail Panel (split-view) ─────────────────────────────────────────────
function OutletDetail({ outlet, brandAverages, period, onClose }) {
  if (!outlet) return null;
  const status = getStatus(outlet);
  const rev = safeNum(outlet.revenue);
  const orders = safeNum(outlet.orders);
  const aov = safeNum(outlet.aov);
  const cancelRate = safeNum(outlet.cancellationRate);
  const share = safeNum(outlet.share);
  const healthScore = safeNum(outlet.healthScore);

  const avgRev = safeNum(brandAverages.revenue || 0);
  const avgOrders = safeNum(brandAverages.orders || 0);
  const avgAov = safeNum(brandAverages.aov || 0);
  const avgCancel = safeNum(brandAverages.cancelRate || 0);

  const revComparison = avgRev > 0 ? (rev / avgRev) - 1 : 0;
  const ordersComparison = avgOrders > 0 ? (orders / avgOrders) - 1 : 0;
  const aovComparison = avgAov > 0 ? (aov / avgAov) - 1 : 0;
  const cancelComparison = avgCancel > 0 ? (cancelRate / avgCancel) - 1 : 0;

  let reasons = [];
  if (status === 'attention' || status === 'critical') {
    if (cancelRate > 10) reasons.push('Cancellation rate above threshold');
    if (rev < avgRev * 0.8) reasons.push('Revenue below outlet average');
    if (orders < avgOrders * 0.7) reasons.push('Low order volume');
  }
  if (reasons.length === 0 && status !== 'healthy') {
    reasons.push('Performance requires review');
  }

  const outletInsights = [];
  if (rev > 0 && share > 50) {
    outletInsights.push({ icon: CheckCircle, text: 'Top performer – highest revenue outlet', severity: 'positive' });
  }
  if (cancelRate > 15) {
    outletInsights.push({ icon: AlertTriangle, text: `Cancellation rate elevated (${safePct(cancelRate)}) vs brand avg ${safePct(avgCancel)}`, severity: 'warning' });
  }
  if (cancelRate > 25) {
    outletInsights.push({ icon: AlertCircle, text: `Very high cancellation rate (${safePct(cancelRate)})`, severity: 'critical' });
  }
  if (share > 30) {
    outletInsights.push({ icon: TrendingUp, text: `Drives ${share.toFixed(0)}% of brand revenue`, severity: 'positive' });
  }
  if (outletInsights.length === 0 && rev > 0) {
    outletInsights.push({ icon: CheckCircle, text: 'Healthy performance', severity: 'positive' });
  }

  const severityBg = {
    positive: 'bg-green-50',
    warning: 'bg-amber-50',
    critical: 'bg-red-50',
  };

  const periodLabel = { today: 'Today', '7d': '7 days', '30d': '30 days' }[period] || '7 days';

  return (
    <div className="bg-white border border-gray-100 rounded-lg p-5 h-full overflow-y-auto">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-lg font-medium text-gray-900">{outlet.outletName}</h2>
          <StatusChip status={status} outlet={outlet} />
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg leading-none lg:hidden">✕</button>
      </div>

      <div className="mb-4">
        <div className="text-xs text-gray-400 mb-1">Revenue ({periodLabel})</div>
        <div className="text-3xl font-bold text-gray-900">{fmtFull(rev)}</div>
        <div className="text-sm text-gray-500 mt-1 flex items-center gap-2">
          <span>{orders} orders</span>
          <span className="text-gray-300">·</span>
          <span>AOV {aov > 0 ? fmtFull(aov) : '—'}</span>
          <span className="text-gray-300">·</span>
          <span>Cancel {safePct(cancelRate)}</span>
        </div>
        {share > 0 && (
          <div className="mt-2">
            <div className="flex justify-between text-xs text-gray-500">
              <span>{share.toFixed(0)}% of brand revenue</span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full mt-1">
              <div className="h-2 bg-indigo-600 rounded-full" style={{ width: `${Math.min(share, 100)}%` }} />
            </div>
          </div>
        )}
      </div>

      {healthScore > 0 && (
        <div className="bg-gray-50 rounded-lg p-3 mb-4 flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700">Health Score</span>
          <div>
            <span className="text-lg font-bold text-gray-900">{healthScore}</span>
            <span className="text-sm text-gray-500 ml-1">/ 100</span>
          </div>
        </div>
      )}

      {reasons.length > 0 && (
        <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 mb-4">
          <div className="text-xs font-medium text-amber-700">Why {STATUS_LABEL[status]}</div>
          <ul className="text-sm text-amber-800 mt-1 list-disc list-inside">
            {reasons.map((r, i) => <li key={i}>{r}</li>)}
          </ul>
        </div>
      )}

      <div className="bg-gray-50 rounded-lg p-3 mb-4">
        <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Performance Summary <span className="font-normal">vs brand average</span></div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-gray-500">Revenue</span>
            <span className={`ml-2 font-medium ${revComparison > 0.05 ? 'text-green-600' : revComparison < -0.05 ? 'text-red-600' : 'text-gray-600'}`}>
              {revComparison > 0.05 ? '↑' : revComparison < -0.05 ? '↓' : '→'} {Math.abs(revComparison * 100).toFixed(0)}%
            </span>
          </div>
          <div>
            <span className="text-gray-500">Orders</span>
            <span className={`ml-2 font-medium ${ordersComparison > 0.05 ? 'text-green-600' : ordersComparison < -0.05 ? 'text-red-600' : 'text-gray-600'}`}>
              {ordersComparison > 0.05 ? '↑' : ordersComparison < -0.05 ? '↓' : '→'} {Math.abs(ordersComparison * 100).toFixed(0)}%
            </span>
          </div>
          <div>
            <span className="text-gray-500">AOV</span>
            <span className={`ml-2 font-medium ${aovComparison > 0.05 ? 'text-green-600' : aovComparison < -0.05 ? 'text-red-600' : 'text-gray-600'}`}>
              {aovComparison > 0.05 ? '↑' : aovComparison < -0.05 ? '↓' : '→'} {Math.abs(aovComparison * 100).toFixed(0)}%
            </span>
          </div>
          <div>
            <span className="text-gray-500">Cancellation</span>
            <span className={`ml-2 font-medium ${cancelComparison > 0.05 ? 'text-red-600' : cancelComparison < -0.05 ? 'text-green-600' : 'text-gray-600'}`}>
              {cancelComparison > 0.05 ? '↑' : cancelComparison < -0.05 ? '↓' : '→'} {Math.abs(cancelComparison * 100).toFixed(0)}%
            </span>
          </div>
        </div>
      </div>

      {outletInsights.length > 0 && (
        <div className="mb-4">
          <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">💡 Insights</div>
          <div className="space-y-1.5">
            {outletInsights.map((ins, i) => (
              <div key={i} className={`text-sm text-gray-700 rounded px-3 py-2 ${severityBg[ins.severity] || 'bg-gray-50'}`}>
                <ins.icon className="inline h-3.5 w-3.5 mr-1" />
                {ins.text}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mb-4">
        <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">🎯 Recommended</div>
        <div className="space-y-1.5">
          {cancelRate > 10 && (
            <button className="w-full text-left text-sm text-gray-700 bg-gray-50 hover:bg-gray-100 rounded px-3 py-2 transition">
              Review cancellations
            </button>
          )}
          {share > 50 && (
            <button className="w-full text-left text-sm text-gray-700 bg-gray-50 hover:bg-gray-100 rounded px-3 py-2 transition">
              Monitor lunch rush
            </button>
          )}
          <button className="w-full text-left text-sm text-gray-700 bg-gray-50 hover:bg-gray-100 rounded px-3 py-2 transition">
            Open analytics →
          </button>
        </div>
      </div>

      <div>
        <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Quick actions</div>
        <div className="space-y-1.5">
          <button
            onClick={() => window.location.href = `/orders?outlet=${outlet.outletId}`}
            className="w-full flex items-center gap-2 text-sm text-gray-700 bg-gray-50 hover:bg-gray-100 rounded px-3 py-2 transition"
          >
            <Coffee className="h-3.5 w-3.5" /> View live orders
          </button>
          <button
            onClick={() => window.location.href = `/owner/menu?outlet=${outlet.outletId}`}
            className="w-full flex items-center gap-2 text-sm text-gray-700 bg-gray-50 hover:bg-gray-100 rounded px-3 py-2 transition"
          >
            <MenuIcon className="h-3.5 w-3.5" /> Menu management
          </button>
          <button
            onClick={() => window.location.href = `/owner/outlet-analytics?outlet=${outlet.outletId}`}
            className="w-full flex items-center gap-2 text-sm text-gray-700 bg-gray-50 hover:bg-gray-100 rounded px-3 py-2 transition"
          >
            <BarChart3 className="h-3.5 w-3.5" /> Outlet analytics
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
const SORT_KEYS = [
  { key: 'revenue', label: 'Revenue' },
  { key: 'orders', label: 'Orders' },
  { key: 'aov', label: 'AOV' },
  { key: 'cancel', label: 'Cancel' },
];

export default function OutletsPage() {
  const navigate = useNavigate();
  const outlet = useAuthStore(s => s.outlet);
  const { organizationId } = getTenantContext(outlet);

  const [period, setPeriod] = useState('7d');
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState('revenue');
  const [sortDir, setSortDir] = useState('desc');
  const [selectedOutlet, setSelectedOutlet] = useState(null);

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
        const data = res.data?.data || null;
        setAnalyticsData(data);
        if (data?.outlets?.length > 0 && !selectedOutlet) {
          setSelectedOutlet(data.outlets[0]);
        }
      })
      .catch((err) => {
        if (currentRequest !== requestIdRef.current) return;
        console.error('Failed to load outlets:', err);
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

  const outlets = analyticsData?.outlets || [];
  const summary = analyticsData?.summary || {};

  const activeOutlets = outlets.filter(o => safeNum(o.revenue) > 0 || safeNum(o.orders) > 0);
  const brandTotalRevenue = outlets.reduce((sum, o) => sum + safeNum(o.revenue), 0);

  const brandAverages = {
    revenue: activeOutlets.length > 0
      ? activeOutlets.reduce((sum, o) => sum + safeNum(o.revenue), 0) / activeOutlets.length
      : 0,
    orders: activeOutlets.length > 0
      ? activeOutlets.reduce((sum, o) => sum + safeNum(o.orders), 0) / activeOutlets.length
      : 0,
    aov: safeNum(summary.aov),
    cancelRate: safeNum(summary.cancelRate),
  };

  const enrichedOutlets = useMemo(() => {
    const avgRev = brandAverages.revenue || 1;
    return outlets.map(o => ({
      ...o,
      relativePerformance: avgRev > 0 ? (safeNum(o.revenue) / avgRev) : 0,
    }));
  }, [outlets, brandAverages.revenue]);

  const sortedOutlets = useMemo(() => {
    const q = search.toLowerCase();
    return enrichedOutlets
      .filter(o => !q || (o.outletName || '').toLowerCase().includes(q))
      .sort((a, b) => {
        let av = 0, bv = 0;
        if (sortKey === 'revenue') { av = safeNum(a.revenue); bv = safeNum(b.revenue); }
        if (sortKey === 'orders') { av = safeNum(a.orders); bv = safeNum(b.orders); }
        if (sortKey === 'aov') { av = safeNum(a.aov); bv = safeNum(b.aov); }
        if (sortKey === 'cancel') { av = safeNum(a.cancellationRate); bv = safeNum(b.cancellationRate); }
        return sortDir === 'desc' ? bv - av : av - bv;
      });
  }, [enrichedOutlets, search, sortKey, sortDir]);

  function handleSort(key) {
    if (sortKey === key) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortKey(key); setSortDir('desc'); }
  }

  function handleRowClick(outlet) {
    setSelectedOutlet(outlet);
  }

  const periodLabel = { today: 'Today', '7d': 'Last 7 days', '30d': 'Last 30 days' }[period];
  const revenueHeader = period === 'today'
    ? 'Revenue (Today)'
    : period === '30d'
      ? 'Revenue (30D)'
      : 'Revenue (7D)';

  if (loading) {
    return (
      <div className="p-6 max-w-screen-xl mx-auto space-y-4">
        <div className="flex justify-between">
          <div className="space-y-2"><Skeleton className="h-6 w-32" /><Skeleton className="h-3 w-56" /></div>
          <Skeleton className="h-8 w-28" />
        </div>
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-10 w-full" />
        <div className="bg-white border border-gray-100 rounded-lg overflow-hidden">
          {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-14 border-b border-gray-50" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-screen-xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-medium text-gray-900">Outlets</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            {outlets.length} outlet{outlets.length !== 1 ? 's' : ''} · Monitor and compare all locations
          </p>
        </div>
        <div className="flex items-center gap-4">
          <FilterBar period={period} onChange={setPeriod} />
          <button
            onClick={() => navigate('/owner/outlets/create')}
            className="text-xs px-3 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition font-medium"
          >
            + Add Outlet
          </button>
        </div>
      </div>

      <OutletSummary outlets={outlets} />
      <InsightsBar outlets={outlets} period={period} />

      <div className="grid lg:grid-cols-[1fr_420px] gap-4">
        <div>
          <div className="flex items-center justify-between mb-4 gap-3">
            <input
              type="text"
              placeholder="Search outlets…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-gray-400 bg-white w-48"
            />
            <div className="flex gap-1.5">
              {SORT_KEYS.map(s => (
                <SortButton
                  key={s.key}
                  label={s.label}
                  active={sortKey === s.key}
                  dir={sortDir}
                  onClick={() => handleSort(s.key)}
                />
              ))}
            </div>
          </div>

          {sortedOutlets.length === 0 && (
            <div className="bg-white border border-gray-100 rounded-lg py-16 text-center">
              <div className="text-gray-300 text-3xl mb-3">🏪</div>
              <p className="text-sm text-gray-500">
                {search ? 'No outlets match your search.' : 'No outlets yet.'}
              </p>
            </div>
          )}

          {sortedOutlets.length > 0 && (
            <div className="bg-white border border-gray-100 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {[
                      { label: '#', key: null },
                      { label: 'Outlet', key: null },
                      { label: revenueHeader, key: 'revenue' },
                      { label: 'Share', key: null },
                      { label: 'Orders', key: 'orders' },
                      { label: 'AOV', key: 'aov' },
                      { label: 'Cancellation', key: 'cancel' },
                      { label: 'Status', key: null },
                    ].map(({ label, key }) => (
                      <th
                        key={label}
                        onClick={() => key && handleSort(key)}
                        className={`text-left py-2.5 px-3 font-medium text-gray-400 ${
                          key ? 'cursor-pointer hover:text-gray-600 select-none' : ''
                        }`}
                        style={{ fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase' }}
                      >
                        {label}
                        {key && sortKey === key ? (sortDir === 'desc' ? ' ↓' : ' ↑') : ''}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedOutlets.map((o, idx) => {
                    const status = getStatus(o);
                    const rev = safeNum(o.revenue);
                    const share = brandTotalRevenue > 0 ? (rev / brandTotalRevenue) * 100 : 0;
                    const relative = o.relativePerformance || 0;
                    const isSelected = selectedOutlet?.outletId === o.outletId;
                    return (
                      <tr
                        key={o.outletId || idx}
                        className={`border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors cursor-pointer ${
                          isSelected ? 'bg-indigo-50 border-l-2 border-indigo-500' : ''
                        }`}
                        onClick={() => handleRowClick(o)}
                      >
                        <td className="py-3 px-3 text-sm text-gray-400">
                          {idx + 1}
                        </td>
                        <td className="py-3 px-3">
                          <div className="text-sm font-medium text-gray-800">{o.outletName}</div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-medium tabular-nums ${rev > 0 ? 'text-gray-900' : 'text-gray-300'}`}>
                              {fmtFull(rev)}
                            </span>
                            {relative > 1.2 && (
                              <span className="text-xs text-green-600 ml-1">+{((relative - 1) * 100).toFixed(0)}%</span>
                            )}
                            <div className="w-16 h-2 bg-gray-100 rounded-full">
                              <div
                                className="h-2 bg-green-600 rounded-full"
                                style={{ width: `${Math.min(share, 100)}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-xs text-gray-400">{share.toFixed(0)}%</td>
                        <td className={`py-3 px-3 text-sm tabular-nums ${o.orders > 0 ? 'text-gray-800' : 'text-gray-300'}`}>
                          {o.orders}
                        </td>
                        <td className={`py-3 px-3 text-sm tabular-nums ${rev > 0 ? 'text-gray-800' : 'text-gray-300'}`}>
                          {o.aov > 0 ? fmtFull(o.aov) : '—'}
                        </td>
                        <td className="py-3 px-3 text-sm text-gray-600">
                          {safePct(o.cancellationRate)}
                        </td>
                        <td className="py-3 px-3">
                          <StatusChip status={status} outlet={o} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {sortedOutlets.length > 0 && (
            <p className="text-xs text-gray-400 mt-2">
              Showing {sortedOutlets.length} of {outlets.length} outlet{outlets.length !== 1 ? 's' : ''} · Revenue data is {periodLabel.toLowerCase()}
            </p>
          )}
        </div>

        <div className="hidden lg:block">
          {selectedOutlet ? (
            <OutletDetail
              outlet={selectedOutlet}
              brandAverages={brandAverages}
              period={period}
              onClose={() => setSelectedOutlet(null)}
            />
          ) : (
            <div className="bg-white border border-gray-100 rounded-lg p-6 text-center text-gray-400 h-full flex items-center justify-center">
              Select an outlet to view details
            </div>
          )}
        </div>
      </div>

      {selectedOutlet && (
        <div className="lg:hidden fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/20" onClick={() => setSelectedOutlet(null)} />
          <div className="relative w-80 bg-white shadow-xl h-full overflow-y-auto">
            <OutletDetail
              outlet={selectedOutlet}
              brandAverages={brandAverages}
              period={period}
              onClose={() => setSelectedOutlet(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}