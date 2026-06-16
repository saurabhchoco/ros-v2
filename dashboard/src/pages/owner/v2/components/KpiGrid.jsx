import { formatCurrency, formatDelta } from '../utils/formatters';

export default function KpiGrid({ today, yesterday }) {
  const revenueDelta = formatDelta(today.revenue, yesterday.revenue);
  const ordersDelta = formatDelta(today.orders, yesterday.orders);
  // For AOV and cancellation rate, we compare vs 7-day average (optional)
  const aovDelta = { text: 'New', neutral: true };
  const cancelDelta = { text: 'New', neutral: true };

  return (
    <div className="grid grid-cols-4 gap-3">
      <KpiCard label="Revenue today" value={formatCurrency(today.revenue)} delta={revenueDelta} />
      <KpiCard label="Orders today" value={today.orders} delta={ordersDelta} />
      <KpiCard label="Avg order value" value={formatCurrency(today.aov)} delta={aovDelta} />
      <KpiCard label="Cancellation rate" value={`${today.cancellationRate.toFixed(1)}%`} delta={cancelDelta} />
    </div>
  );
}

function KpiCard({ label, value, delta }) {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
      <div className="text-xs text-gray-500 uppercase tracking-wide">{label}</div>
      <div className="text-[22px] font-medium mt-1">{value}</div>
      <div className={`text-xs mt-1 ${delta.neutral ? 'text-gray-400' : delta.positive ? 'text-emerald-600' : 'text-red-600'}`}>
        {delta.text}
      </div>
    </div>
  );
}