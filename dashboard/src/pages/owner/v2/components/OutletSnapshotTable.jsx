import { Link } from 'react-router-dom';
import { safeNumber, formatCurrency } from '../utils/formatters';

export default function OutletSnapshotTable({ outlets }) {
  const brandTotalRevenue = outlets.reduce((sum, o) => sum + safeNumber(o.revenue), 0);
  const topOutlets = outlets.slice(0, 5);
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100">
        <h2 className="text-[18px] font-medium">Brand Outlets</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-[11px] font-medium text-gray-500 uppercase tracking-wide">
            <tr>
              <th className="px-4 py-3 text-left">Outlet</th>
              <th className="px-4 py-3 text-right">Revenue (7d)</th>
              <th className="px-4 py-3 text-right">Share</th>
              <th className="px-4 py-3 text-right">Orders</th>
              <th className="px-4 py-3 text-right">AOV</th>
              <th className="px-4 py-3 text-right">Status</th>
            </tr>
          </thead>
          <tbody>
            {topOutlets.map((outlet) => {
              const revenue = safeNumber(outlet.revenue);
              const share = brandTotalRevenue > 0 ? (revenue / brandTotalRevenue) * 100 : 0;
              const isActive = revenue > 0;
              return (
                <tr key={outlet.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{outlet.name}</td>
                  <td className="px-4 py-3 text-right">{formatCurrency(revenue)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-16 bg-gray-200 rounded-full h-1.5">
                        <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${share}%` }}></div>
                      </div>
                      <span className="text-xs text-gray-500">{share.toFixed(0)}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">{safeNumber(outlet.orderCount)}</td>
                  <td className="px-4 py-3 text-right">{formatCurrency(outlet.avgOrderValue)}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full ${isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-gray-400'}`}></span>
                      {isActive ? 'Healthy' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {outlets.length > 5 && (
        <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-500 text-center">
          Showing 5 of {outlets.length} outlets · <Link to="/owner/v2/outlets" className="text-indigo-600 hover:underline">View all →</Link>
        </div>
      )}
    </div>
  );
}