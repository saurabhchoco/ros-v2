import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../services/api';
import { adminApi } from '../../services/adminApi';
import { useAuthStore } from '../../store/authStore';

export default function BrandAnalytics() {
  const navigate = useNavigate();
  const { outlet } = useAuthStore();
  const [period, setPeriod] = useState('day');
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await apiService.getBrandAnalytics(period);
      setAnalytics(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-6 text-center">Loading analytics...</div>;
  if (!analytics) return <div className="p-6 text-center text-red-500">Failed to load data</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">📊 Brand Analytics</h2>
        <div className="flex gap-2">
          <button onClick={() => setPeriod('day')} className={`px-4 py-2 rounded ${period === 'day' ? 'bg-indigo-500 text-white' : 'bg-gray-200'}`}>Today</button>
          <button onClick={() => setPeriod('week')} className={`px-4 py-2 rounded ${period === 'week' ? 'bg-indigo-500 text-white' : 'bg-gray-200'}`}>This Week</button>
          <button onClick={() => setPeriod('month')} className={`px-4 py-2 rounded ${period === 'month' ? 'bg-indigo-500 text-white' : 'bg-gray-200'}`}>This Month</button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-2xl shadow p-6">
          <p className="text-gray-500 text-sm">Total Revenue</p>
          <p className="text-3xl font-bold text-gray-800">₹{analytics.totalRevenue.toFixed(0)}</p>
        </div>
        <div className="bg-white rounded-2xl shadow p-6">
          <p className="text-gray-500 text-sm">Total Orders</p>
          <p className="text-3xl font-bold text-gray-800">{analytics.totalOrders}</p>
        </div>
        <div className="bg-white rounded-2xl shadow p-6">
          <p className="text-gray-500 text-sm">Average Order Value</p>
          <p className="text-3xl font-bold text-gray-800">₹{analytics.avgOrderValue.toFixed(0)}</p>
        </div>
      </div>

      {/* Top Items */}
      <div className="bg-white rounded-2xl shadow p-6 mb-8">
        <h3 className="text-xl font-bold text-gray-800 mb-4">🏆 Top Selling Items</h3>
        <div className="space-y-2">
          {analytics.topItems.map(item => (
            <div key={item.name} className="flex justify-between border-b pb-2">
              <span>{item.name}</span>
              <span className="font-medium">{item.quantity} sold</span>
              <span className="text-indigo-600">₹{item.revenue}</span>
            </div>
          ))}
          {analytics.topItems.length === 0 && <p className="text-gray-400">No orders yet</p>}
        </div>
      </div>

      {/* Outlets Performance */}
      <div className="bg-white rounded-2xl shadow p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Outlets Performance</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {analytics.outlets.map(outlet => (
            <div key={outlet.id} className="border rounded-lg p-4 flex justify-between items-center">
              <div>
                <p className="font-semibold">{outlet.name}</p>
                <p className="text-sm text-gray-500">{outlet.orderCount} orders · ₹{outlet.revenue}</p>
              </div>
              <button
                onClick={() => navigate(`/owner/outlet-analytics?outlet=${outlet.id}`)}
                className="text-indigo-500 text-sm font-medium hover:underline"
              >
                View Details →
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}