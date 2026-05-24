import { useEffect, useState, useMemo, useRef } from 'react';
import { useAuthStore } from '../store/authStore';
import { useOrderStore } from '../store/orderStore';
import { kdsService } from '../services/firebase';
import { apiService } from '../services/api';
import OrderCard from '../components/OrderCard';
import { useSoundAlert } from '../hooks/useSoundAlert';
import Skeleton from '../components/ui/Skeleton';
import toast from 'react-hot-toast'; // ✅ ADD THIS

export default function KDSScreen() {
  const outlet = useAuthStore((s) => s.outlet);
  const { orders, setOrders } = useOrderStore();
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [stats, setStats] = useState({ completedToday: 0, avgPrepTime: 0 });
  const previousOrdersCount = useRef(0);
  
  useSoundAlert(orders);

  useEffect(() => {
    // Only flash if orders count increased AND tab is hidden
    if (orders.length > previousOrdersCount.current && document.hidden) {
      const originalTitle = document.title;
      let flashCount = 0;
      const interval = setInterval(() => {
        document.title = flashCount % 2 === 0 ? '🔔 New Order!' : originalTitle;
        flashCount++;
        if (flashCount >= 6) { // flash for ~3 seconds (6 changes)
          clearInterval(interval);
          document.title = originalTitle;
        }
      }, 500);
      return () => clearInterval(interval);
    }
    previousOrdersCount.current = orders.length;
  }, [orders.length]);

  // Fetch kitchen stats
  const fetchStats = async () => {
    if (!outlet?.organizationId || !outlet?.outletId) return;
    setStatsLoading(true);
    try {
      const res = await apiService.getKitchenStats(outlet.organizationId, outlet.outletId);
      setStats(res.data.data);
    } catch (err) {
      console.error('Failed to fetch kitchen stats', err);
    } finally {
      setStatsLoading(false);
    }
  };

const handleCancel = async (orderId, reason) => {
  try {
    await apiService.updateOrderStatus(orderId, 'CANCELLED', reason);
    toast.success('Order cancelled');
  } catch (error) {
    toast.error(error.response?.data?.message || 'Failed to cancel order');
  }
};

  // Subscribe to real‑time orders
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
        // Refresh stats when orders change (new order or status update)
        fetchStats();
      }
    );

    fetchStats(); // initial stats

    return () => unsubscribe();
  }, [outlet, setOrders]);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await apiService.updateOrderStatus(orderId, newStatus);
      // Stats will refresh via the listener
    } catch (error) {
      alert('Failed to update order status');
    }
  };

  const grouped = useMemo(() => ({
    NEW: orders.filter(o => o.orderStatus === 'NEW'),
    PREPARING: orders.filter(o => o.orderStatus === 'PREPARING'),
    READY: orders.filter(o => o.orderStatus === 'READY'),
  }), [orders]);

  if (loading) {
    return (
      <div className="p-6 h-full flex flex-col">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="grid grid-cols-3 gap-6">
          {[1,2,3].map(col => (
            <div key={col} className="bg-gray-100 rounded-2xl p-5">
              <Skeleton className="h-6 w-24 mb-4" />
              <div className="space-y-3">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!outlet) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-red-500">Loading outlet...</div>
      </div>
    );
  }

  const columns = [
    {
      key: 'NEW',
      label: '🆕 New Orders',
      orders: grouped.NEW,
      bg: 'bg-red-50',
      border: 'border-red-400',
      badge: 'bg-indigo-500',
      nextLabel: 'Start Preparing',
      nextStatus: 'PREPARING',
      btnColor: 'bg-indigo-500 hover:bg-indigo-600',
    },
    {
      key: 'PREPARING',
      label: '👨‍🍳 Preparing',
      orders: grouped.PREPARING,
      bg: 'bg-yellow-50',
      border: 'border-yellow-400',
      badge: 'bg-yellow-500',
      nextLabel: 'Mark Ready',
      nextStatus: 'READY',
      btnColor: 'bg-yellow-500 hover:bg-yellow-600',
    },
    {
      key: 'READY',
      label: '✅ Ready',
      orders: grouped.READY,
      bg: 'bg-green-50',
      border: 'border-green-400',
      badge: 'bg-green-500',
      nextLabel: 'Complete Order',
      nextStatus: 'COMPLETED',
      btnColor: 'bg-green-500 hover:bg-green-600',
    },
  ];

  return (
    <div className="p-6 h-full flex flex-col">
      {/* Header with stats */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            {outlet.outletName || outlet.fullName || 'Kitchen Display System'}
          </h2>
          <p className="text-gray-500 text-sm mt-1">Real-time order management</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-white rounded-xl shadow-sm px-4 py-2 text-center min-w-[100px]">
            <p className="text-xs text-gray-500">Completed Today</p>
            <p className="text-2xl font-bold text-green-600">
              {statsLoading ? '...' : stats.completedToday}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm px-4 py-2 text-center min-w-[100px]">
            <p className="text-xs text-gray-500">Avg Prep Time</p>
            <p className="text-2xl font-bold text-indigo-600">
              {statsLoading ? '...' : `${stats.avgPrepTime} min`}
            </p>
          </div>
          <div className="bg-indigo-500 text-white px-4 py-2 rounded-full font-bold text-sm flex items-center">
            {orders.length} active order{orders.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Kanban Columns */}
      <div className="grid grid-cols-3 gap-6 flex-1 min-h-0">
        {columns.map(col => (
          <div
            key={col.key}
            className={`${col.bg} border-t-4 ${col.border} rounded-2xl p-5 flex flex-col overflow-hidden`}
          >
            <div className="flex items-center justify-between mb-5 flex-shrink-0">
              <h3 className="text-xl font-bold text-gray-800">{col.label}</h3>
              <span className={`${col.badge} text-white rounded-full px-3 py-1 text-sm font-bold`}>
                {col.orders.length}
              </span>
            </div>
            <div className="overflow-y-auto flex-1 space-y-4 pr-1">
              {col.orders.length === 0 ? (
                <div className="text-center text-gray-400 py-12 text-sm">No orders</div>
              ) : (
                col.orders.map(order => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    nextLabel={col.nextLabel}
                    nextStatus={col.nextStatus}
                    btnColor={col.btnColor}
                    onStatusChange={handleStatusChange}
                    onCancel={handleCancel}  // ✅ ADD THIS LINE
                  />
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}