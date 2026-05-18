import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useOrderStore } from '../store/orderStore';
import { kdsService } from '../services/firebase';
import { apiService } from '../services/api';
import OrderCard from '../components/OrderCard';

export default function KDSScreen() {
  const outlet = useAuthStore((s) => s.outlet);
  const { orders, setOrders } = useOrderStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!outlet?.organizationId || !outlet?.outletId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = kdsService.subscribeToActiveOrders(
      outlet.organizationId,
      outlet.outletId,
      (activeOrders) => {
        setOrders(activeOrders);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [outlet, setOrders]);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await apiService.updateOrderStatus(orderId, newStatus);
    } catch (error) {
      console.error('Failed to update order:', error);
    }
  };

  const grouped = {
    NEW: orders.filter(o => o.orderStatus === 'NEW'),
    PREPARING: orders.filter(o => o.orderStatus === 'PREPARING'),
    READY: orders.filter(o => o.orderStatus === 'READY')
  };

  if (loading) {
    return <div className="p-8 text-center">Loading KDS...</div>;
  }

  if (!outlet) {
    return <div className="p-8 text-center text-red-600">No outlet assigned</div>;
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900">
          {outlet.outletName || 'Kitchen Display System'}
        </h2>
        <p className="text-gray-600 mt-2">{orders.length} active orders</p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-bold mb-4">🆕 New ({grouped.NEW.length})</h3>
          <div className="space-y-4">
            {grouped.NEW.map(order => (
              <OrderCard
                key={order.id}
                order={order}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>
        </div>

        <div className="bg-yellow-50 rounded-lg p-4">
          <h3 className="text-lg font-bold mb-4">👨‍🍳 Preparing ({grouped.PREPARING.length})</h3>
          <div className="space-y-4">
            {grouped.PREPARING.map(order => (
              <OrderCard
                key={order.id}
                order={order}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>
        </div>

        <div className="bg-green-50 rounded-lg p-4">
          <h3 className="text-lg font-bold mb-4">✅ Ready ({grouped.READY.length})</h3>
          <div className="space-y-4">
            {grouped.READY.map(order => (
              <OrderCard
                key={order.id}
                order={order}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
