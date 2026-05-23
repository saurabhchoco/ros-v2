import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { adminApi } from '../../services/adminApi';
import { apiService } from '../../services/api'; // ✅ add this import
import Skeleton from '../../components/ui/Skeleton';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#4f46e5', '#f59e0b', '#10b981', '#ef4444'];

export default function BrandOwnerDashboard() {
  const navigate = useNavigate();
  const outlet = useAuthStore((s) => s.outlet);
  const [outlets, setOutlets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [revenueData, setRevenueData] = useState([]);
  const [statusData, setStatusData] = useState([]);
  const [outletComparison, setOutletComparison] = useState([]);
  const [chartsLoading, setChartsLoading] = useState(true);

  // Fetch chart data
  const fetchRevenueTrend = async () => {
    try {
      const res = await apiService.getRevenueTrend(outlet?.organizationId);
      setRevenueData(res.data.data || []);
    } catch (err) { console.error(err); }
  };
  const fetchOrderStatus = async () => {
    try {
      const res = await apiService.getOrderStatusDistribution(outlet?.organizationId);
      setStatusData(res.data.data || []);
    } catch (err) { console.error(err); }
  };
  const fetchOutletComparison = async () => {
    try {
      const res = await apiService.getOutletComparison(outlet?.organizationId);
      setOutletComparison(res.data.data || []);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    if (outlet?.organizationId) {
      Promise.all([fetchRevenueTrend(), fetchOrderStatus(), fetchOutletComparison()]).finally(() => setChartsLoading(false));
    }
  }, [outlet]);

  // Load outlets (existing)
  useEffect(() => {
    const orgId = outlet?.organization_id || outlet?.organizationId;
    if (!orgId) { setLoading(false); return; }
    const load = async () => {
      try {
        const res = await adminApi.listOutlets(orgId, true);
        setOutlets(res.data.data || []);
      } catch (e) { console.error(e); } finally { setLoading(false); }
    };
    load();
  }, [outlet]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div><Skeleton className="h-8 w-48 mb-2" /><Skeleton className="h-4 w-32" /></div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1,2].map(i => (
            <div key={i} className="bg-white rounded-2xl shadow-sm p-6">
              <Skeleton className="h-6 w-32 mb-2" />
              <Skeleton className="h-4 w-24 mb-4" />
              <div className="flex gap-2"><Skeleton className="h-8 w-16" /><Skeleton className="h-8 w-20" /></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">My Outlets</h2>
          <p className="text-gray-500 text-sm mt-1">{outlets.length} outlet{outlets.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => navigate('/owner/outlets/create')} className="px-4 py-2 bg-indigo-500 text-white rounded-lg font-semibold hover:bg-indigo-600 transition">+ Add Outlet</button>
      </div>

      {/* Outlet Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {outlets.map((out) => (
          <div key={out.id} className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-md transition">
            <h3 className="font-bold text-lg text-gray-800 mb-2">{out.name}</h3>
            <p className="text-xs text-gray-400 mb-4">{out.outlet_type}</p>
            <div className="flex gap-2">
              <button onClick={() => navigate(`/owner/menu?outlet=${out.id}`)} className="flex-1 px-3 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-sm font-medium hover:bg-indigo-100 transition">Menu</button>
              <button onClick={() => navigate(`/owner/managers?outlet=${out.id}`)} className="flex-1 px-3 py-2 bg-green-50 text-green-600 rounded-lg text-sm font-medium hover:bg-green-100 transition">Managers</button>
              <button onClick={() => navigate(`/owner/outlet-analytics?outlet=${out.id}`)} className="flex-1 px-3 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-sm font-medium hover:bg-indigo-100 transition">Analytics</button>
            </div>
          </div>
        ))}
        {outlets.length === 0 && <div className="text-center text-gray-400 py-16 col-span-2">No outlets yet. <button onClick={() => navigate('/owner/outlets/create')} className="text-indigo-500 underline">Create one</button></div>}
      </div>

      {/* Charts & Comparison Section (only if data exists or no error) */}
      {!chartsLoading && (revenueData.length > 0 || statusData.length > 0 || outletComparison.length > 0) && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
            {/* Revenue Trend */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Revenue Trend (Last 7 Days)</h3>
              {revenueData.length === 0 ? (
                <p className="text-gray-400 text-center py-8">No order data yet</p>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value) => `₹${value}`} />
                    <Legend />
                    <Line type="monotone" dataKey="revenue" stroke="#4f46e5" name="Revenue (₹)" />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Order Status Distribution */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Order Status</h3>
              {statusData.length === 0 ? (
                <p className="text-gray-400 text-center py-8">No orders yet</p>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={statusData} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={100} label>
                      {statusData.map((entry, idx) => (
                        <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Outlet Comparison Table */}
          <div className="bg-white rounded-2xl shadow-sm p-6 mt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Outlet Performance</h3>
            {outletComparison.length === 0 ? (
              <p className="text-gray-400 text-center py-4">No outlet data available</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3">Outlet</th>
                      <th className="text-right p-3">Orders</th>
                      <th className="text-right p-3">Revenue</th>
                      <th className="text-right p-3">Avg. Order</th>
                    </tr>
                  </thead>
                  <tbody>
                    {outletComparison.map(out => (
                      <tr key={out.id} className="border-b hover:bg-gray-50">
                        <td className="p-3 font-medium">{out.name}</td>
                        <td className="p-3 text-right">{out.orderCount}</td>
                        <td className="p-3 text-right">₹{out.revenue.toFixed(0)}</td>
                        <td className="p-3 text-right">₹{out.avgOrderValue.toFixed(0)}</td>
                       </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}