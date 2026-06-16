import React from 'react';
import { AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';

export const BrandStatusChip = ({ outlets }) => {
  const total = outlets.length;
  const healthy = outlets.filter(o => o.healthStatus === 'Healthy').length;
  const attention = outlets.filter(o => o.healthStatus === 'Attention').length;
  const inactive = outlets.filter(o => o.healthStatus === 'Inactive').length;

  let status, icon, color;
  if (inactive > 0 || attention > Math.ceil(total / 3)) {
    status = 'Critical';
    icon = <AlertCircle className="w-4 h-4" />;
    color = 'bg-red-100 text-red-800 border-red-200';
  } else if (attention > 0 || healthy < total) {
    status = 'Watch';
    icon = <AlertTriangle className="w-4 h-4" />;
    color = 'bg-yellow-100 text-yellow-800 border-yellow-200';
  } else {
    status = 'Healthy';
    icon = <CheckCircle className="w-4 h-4" />;
    color = 'bg-green-100 text-green-800 border-green-200';
  }

  return (
    <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${color}`}>
      {icon}
      <span className="font-semibold">Brand Status: {status}</span>
      <span className="text-sm opacity-75">
        · {healthy}/{total} healthy · {attention} needing attention
      </span>
    </div>
  );
};