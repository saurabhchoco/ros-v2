import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { apiService } from '../services/api';

export default function OrdersList() {
  const outlet = useAuthStore((s) => s.outlet);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    if (!outlet?.organizationId || !outlet?.outletId) {
      setLoading(false);
      return;
    }

    fetchOrders();
  }, [outlet, filter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await apiService.listOrders({ 
        status: filter === 'ALL' ? null : filter 
      });
      
      // Handle both array and object responses
      const orderList = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      setOrders(orderList);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Loading orders...</div>;
  }

  if (!outlet) {
    return <div className="p-8 text-center text-red-600">No outlet assigned</div>;
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Orders</h2>
        
        <div className="mb-4">
          <label className="text-sm font-medium text-gray-700 mr-3">
            Filter:
          </label>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded"
          >
            <option value="ALL">All</option>
            <option value="NEW">New</option>
            <option value="PREPARING">Preparing</option>
            <option value="READY">Ready</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="text-center text-gray-500 py-12">
          No orders found
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100 border-b">
                <th className="text-left p-3">Order #</th>
                <th className="text-left p-3">Customer</th>
                <th className="text-left p-3">Amount</th>
                <th className="text-left p-3">Status</th>
                <th className="text-left p-3">Items</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b hover:bg-gray-50">
                  <td className="p-3 font-bold">
                    {order.order_no}
                  </td>
                  <td className="p-3">
                    {order.customer_name || 'Walk-in'}
                  </td>
                  <td className="p-3">
                    ₹{parseFloat(order.grand_total || 0).toFixed(0)}
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded text-sm font-medium ${
                      order.order_status === 'NEW'
                        ? 'bg-red-100 text-red-700' :
                      order.order_status === 'PREPARING'
                        ? 'bg-yellow-100 text-yellow-700' :
                      order.order_status === 'READY'
                        ? 'bg-green-100 text-green-700' :
                      order.order_status === 'COMPLETED'
                        ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {order.order_status}
                    </span>
                  </td>
                  <td className="p-3">
                    {order.items?.length || 0}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
