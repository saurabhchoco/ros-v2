// dashboard/src/pages/owner/v2/components/OutletDetailModal.jsx
import { X } from 'lucide-react';

function fmtFull(n) {
  const v = parseFloat(n);
  if (!v || isNaN(v)) return '₹0';
  return '₹' + v.toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

export default function OutletDetailModal({ outlet, isOpen, onClose }) {
  if (!isOpen || !outlet) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium">{outlet.name}</h2>
          <button onClick={onClose}><X className="h-5 w-5 text-gray-400" /></button>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-gray-500">Revenue (7d)</span><span className="font-medium">{fmtFull(outlet.revenue)}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Orders</span><span>{outlet.orderCount}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">AOV</span><span>{fmtFull(outlet.avgOrderValue)}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Pending orders</span><span className="text-amber-600">{outlet.pendingOrders}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Cancellations</span><span>{outlet.cancelledOrders}</span></div>
        </div>
        <button onClick={onClose} className="mt-5 w-full bg-gray-100 text-gray-700 py-2 rounded-lg text-sm">Close</button>
      </div>
    </div>
  );
}