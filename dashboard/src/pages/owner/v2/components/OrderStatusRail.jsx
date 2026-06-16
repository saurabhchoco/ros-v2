const statusConfig = {
  NEW: { label: 'New', color: 'red' },
  PREPARING: { label: 'Preparing', color: 'amber' },
  READY: { label: 'Ready', color: 'green' },
  COMPLETED: { label: 'Completed', color: 'blue' }
};

export default function OrderStatusRail({ counts }) {
  const items = Object.entries(statusConfig).map(([key, cfg]) => ({
    label: cfg.label,
    count: counts[key] || 0,
    color: cfg.color
  }));

  return (
    <div className="grid grid-cols-4 gap-3">
      {items.map((item) => (
        <div key={item.label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className={`text-xs text-${item.color}-600 flex items-center gap-1`}>
            <span className={`w-1.5 h-1.5 rounded-full bg-${item.color}-500`}></span>
            {item.label}
          </div>
          <div className="text-[22px] font-medium mt-1">{item.count}</div>
        </div>
      ))}
    </div>
  );
}