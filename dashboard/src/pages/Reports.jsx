import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { apiService } from '../services/api';

export default function Reports() {
  const outlet = useAuthStore((s) => s.outlet);
  const [summary, setSummary] = useState(null);
  const [dateRange, setDateRange] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(
    new Date().toISOString().split('T')[0]
  );

  useEffect(() => {
    if (!outlet?.organizationId) return;
    fetchSummary();
  }, [outlet]);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const res = await apiService.getSummary();
      setSummary(res.data.data || res.data);
    } catch (e) {
      console.error('Failed to load summary', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchDateRange = async () => {
    try {
      setLoading(true);
      const res = await apiService.getByDateRange(startDate, endDate);
      setDateRange(res.data.data || []);
    } catch (e) {
      console.error('Failed to load date range', e);
    } finally {
      setLoading(false);
    }
  };

  if (!outlet) {
    return (
      <div className="flex items-center justify-center h-full text-red-500">
        No outlet assigned
      </div>
    );
  }

  return (
    <div className="p-6 overflow-auto">

      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        Reports
      </h2>

      {/* Today's Summary */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">
          Today's Summary
        </h3>

        {loading && !summary ? (
          <div className="text-gray-400">Loading...</div>
        ) : summary ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {
                label: 'Total Revenue',
                value: `₹${parseFloat(summary.totalRevenue || 0).toFixed(0)}`,
                color: 'text-indigo-600',
                bg: 'bg-indigo-50',
              },
              {
                label: 'Total Orders',
                value: summary.totalOrders || 0,
                color: 'text-green-600',
                bg: 'bg-green-50',
              },
              {
                label: 'Avg Order Value',
                value: `₹${
                  summary.totalOrders > 0
                    ? (parseFloat(summary.totalRevenue) / summary.totalOrders).toFixed(0)
                    : 0
                }`,
                color: 'text-purple-600',
                bg: 'bg-purple-50',
              },
              {
                label: 'Completed',
                value: summary.completedOrders || 0,
                color: 'text-blue-600',
                bg: 'bg-blue-50',
              },
            ].map(stat => (
              <div
                key={stat.label}
                className={`${stat.bg} rounded-2xl p-5`}
              >
                <p className="text-gray-500 text-sm mb-1">{stat.label}</p>
                <p className={`${stat.color} font-extrabold text-3xl`}>
                  {stat.value}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-gray-400">No data available</div>
        )}
      </div>

      {/* Date Range */}
      <div>
        <h3 className="text-lg font-semibold text-gray-700 mb-4">
          Date Range Report
        </h3>

        <div className="flex gap-3 items-end mb-5">
          <div>
            <label className="block text-xs text-gray-500 mb-1">From</label>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">To</label>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400"
            />
          </div>
          <button
            onClick={fetchDateRange}
            className="px-5 py-2 bg-indigo-500 text-white rounded-lg text-sm font-semibold hover:bg-indigo-600 transition"
          >
            Generate
          </button>
        </div>

        {dateRange.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left p-4 text-sm font-semibold text-gray-600">Date</th>
                  <th className="text-left p-4 text-sm font-semibold text-gray-600">Orders</th>
                  <th className="text-left p-4 text-sm font-semibold text-gray-600">Revenue</th>
                  <th className="text-left p-4 text-sm font-semibold text-gray-600">Avg Value</th>
                </tr>
              </thead>
              <tbody>
                {dateRange.map((day, i) => (
                  <tr
                    key={i}
                    className="border-b border-gray-50 hover:bg-gray-50 transition"
                  >
                    <td className="p-4 text-sm text-gray-700 font-medium">
                      {new Date(day.date).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric'
                      })}
                    </td>
                    <td className="p-4 text-sm text-gray-700">
                      {day.totalOrders}
                    </td>
                    <td className="p-4 text-sm font-bold text-indigo-600">
                      ₹{parseFloat(day.totalRevenue || 0).toFixed(0)}
                    </td>
                    <td className="p-4 text-sm text-gray-700">
                      ₹{day.totalOrders > 0
                        ? (parseFloat(day.totalRevenue) / day.totalOrders).toFixed(0)
                        : '0'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {dateRange.length === 0 && !loading && (
          <div className="text-center text-gray-400 py-8 text-sm">
            Select a date range and click Generate
          </div>
        )}
      </div>
    </div>
  );
}