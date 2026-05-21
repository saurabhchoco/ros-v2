import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { apiService } from '../../services/api';

export default function OutletAnalytics() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const outletId = searchParams.get('outlet');
  const [period, setPeriod] = useState('day');
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!outletId) {
      navigate('/owner');
      return;
    }
    fetchAnalytics();
  }, [period, outletId]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await apiService.getOutletAnalytics(outletId, period);
      setAnalytics(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-6 text-center">Loading outlet analytics...</div>;
  if (!analytics) return <div className="p-6 text-center text-red-500">Failed to load data</div>;

  return (
    <div className="p-6">
      <button onClick={() => navigate(-1)} className="text-indigo-500 text-sm mb-4">← Back</button>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">📈 Outlet Analytics</h2>
        <div className="flex gap-2">
          <button onClick={() => setPeriod('day')} className={`px-4 py-2 rounded ${period === 'day' ? 'bg-indigo-500 text-white' : 'bg-gray-200'}`}>Today</button>
          <button onClick={() => setPeriod('week')} className={`px-4 py-2 rounded ${period === 'week' ? 'bg-indigo-500 text-white' : 'bg-gray-200'}`}>This Week</button>
          <button onClick={() => setPeriod('month')} className={`px-4 py-2 rounded ${period === 'month' ? 'bg-indigo-500 text-white' : 'bg-gray-200'}`}>This Month</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-2xl shadow p-6">
          <p className="text-gray-500 text-sm">Revenue</p>
          <p className="text-3xl font-bold text-gray-800">₹{analytics.totalRevenue.toFixed(0)}</p>
        </div>
        <div className="bg-white rounded-2xl shadow p-6">
          <p className="text-gray-500 text-sm">Orders</p>
          <p className="text-3xl font-bold text-gray-800">{analytics.totalOrders}</p>
        </div>
        <div className="bg-white rounded-2xl shadow p-6">
          <p className="text-gray-500 text-sm">Average Order</p>
          <p className="text-3xl font-bold text-gray-800">₹{analytics.avgOrderValue.toFixed(0)}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow p-6">
        <h3 className="text-xl font-bold mb-4">🥇 Top Items at this Outlet</h3>
        <div className="space-y-2">
          {analytics.topItems.map(item => (
            <div key={item.name} className="flex justify-between border-b pb-2">
              <span>{item.name}</span>
              <span>{item.quantity} sold</span>
              <span className="text-indigo-600">₹{item.revenue}</span>
            </div>
          ))}
          {analytics.topItems.length === 0 && <p className="text-gray-400">No orders yet</p>}
        </div>
      </div>
    </div>
  );
}