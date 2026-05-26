import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { apiService } from '../services/api';
import Skeleton from '../components/ui/Skeleton';
import toast from 'react-hot-toast';

export default function OrdersList() {
  const outlet = useAuthStore((s) => s.outlet);
  const userRole = outlet?.role;
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
      const orderList = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      setOrders(orderList);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  // Settle order (Cashier, ARM, Manager)
  const handleSettle = async (orderId, currentMethod) => {
    const method = prompt(`Enter payment method (CASH/UPI/CARD)`, currentMethod || 'CASH');
    if (!method) return;
    try {
      await apiService.settleOrder(orderId, method);
      toast.success('Order settled');
      fetchOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Settlement failed');
    }
  };

  // Edit order (GSA, ARM, Manager)
  const handleEdit = (orderId) => {
    // Placeholder: navigate to edit order page (or open modal)
    // For now, just alert. Later you can implement `/orders/edit/${orderId}`
    alert(`Edit order ${orderId} – feature coming soon`);
    // navigate(`/orders/edit/${orderId}`);
  };

  // Cancel order (GSA, ARM, Manager)
  const handleCancel = async (orderId, currentStatus) => {
    if (currentStatus !== 'NEW' && currentStatus !== 'PREPARING') {
      toast.error('Order cannot be cancelled after preparation');
      return;
    }
    if (!confirm('Cancel this order? This action cannot be undone.')) return;
    const reason = prompt('Reason for cancellation (optional):');
    try {
      await apiService.updateOrderStatus(orderId, 'CANCELLED', { cancellationReason: reason });
      toast.success('Order cancelled');
      fetchOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cancellation failed');
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <Skeleton className="h-8 w-32 mb-4" />
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-3"><Skeleton className="h-4 w-16" /></th>
                <th className="p-3"><Skeleton className="h-4 w-20" /></th>
                <th className="p-3"><Skeleton className="h-4 w-16" /></th>
                <th className="p-3"><Skeleton className="h-4 w-20" /></th>
                <th className="p-3"><Skeleton className="h-4 w-12" /></th>
              </tr>
            </thead>
            <tbody>
              {[1,2,3,4,5].map(i => (
                <tr key={i} className="border-b">
                  <td className="p-3"><Skeleton className="h-4 w-20" /></td>
                  <td className="p-3"><Skeleton className="h-4 w-24" /></td>
                  <td className="p-3"><Skeleton className="h-4 w-16" /></td>
                  <td className="p-3"><Skeleton className="h-6 w-20 rounded-full" /></td>
                  <td className="p-3"><Skeleton className="h-8 w-24" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (!outlet) {
    return <div className="p-8 text-center text-red-600">No outlet assigned</div>;
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Orders</h2>
        <div className="mb-4">
          <label className="text-sm font-medium text-gray-700 mr-3">Filter:</label>
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
        <div className="text-center text-gray-500 py-12">No orders found</div>
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
                <th className="text-left p-3">Payment</th>
                <th className="text-left p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const canSettle = ['CASHIER', 'ARM', 'OUTLET_MANAGER'].includes(userRole) && order.payment_status !== 'PAID';
                const canEdit = ['GSA', 'ARM', 'OUTLET_MANAGER'].includes(userRole) && order.order_status !== 'COMPLETED';
                const canCancel = ['GSA', 'ARM', 'OUTLET_MANAGER'].includes(userRole) && (order.order_status === 'NEW' || order.order_status === 'PREPARING');
                return (
                  <tr key={order.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-bold">{order.order_no}</td>
                    <td className="p-3">{order.customer_name || 'Walk-in'}</td>
                    <td className="p-3">₹{parseFloat(order.grand_total || 0).toFixed(0)}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded text-sm font-medium ${
                        order.order_status === 'NEW' ? 'bg-red-100 text-red-700' :
                        order.order_status === 'PREPARING' ? 'bg-yellow-100 text-yellow-700' :
                        order.order_status === 'READY' ? 'bg-green-100 text-green-700' :
                        order.order_status === 'COMPLETED' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {order.order_status}
                      </span>
                    </td>
                    <td className="p-3">{order.items?.length || 0}</td>
                    <td className="p-3">
                      <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700">
                        {order.payment_method || 'CASH'}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        {canSettle && (
                          <button
                            onClick={() => handleSettle(order.id, order.payment_method)}
                            className="bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded text-xs"
                          >
                            Settle
                          </button>
                        )}
                        {canEdit && (
                          <button
                            onClick={() => handleEdit(order.id)}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs"
                          >
                            Edit
                          </button>
                        )}
                        {canCancel && (
                          <button
                            onClick={() => handleCancel(order.id, order.order_status)}
                            className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}