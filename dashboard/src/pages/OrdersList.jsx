// dashboard/src/pages/OrdersList.jsx
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuthStore } from '../store/authStore';
import { apiService } from '../services/api';
import { getTenantContext } from '../utils/tenantContext';
import toast from 'react-hot-toast';
import Skeleton from '../components/ui/Skeleton';
import Button from '../components/ui/Button';
import { 
  Search, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle,
  ShoppingBag,
  Wallet,
  Coffee
} from 'lucide-react';

// Helpers
const formatTime = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

const getAgeText = (createdAt) => {
  if (!createdAt) return '';
  const diff = Date.now() - new Date(createdAt).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Now';
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h`;
};

const orderSourceLabel = {
  DINE_IN: 'Dine In',
  TAKEAWAY: 'Takeaway',
  DELIVERY: 'Delivery'
};

const statusConfig = {
  NEW: { label: 'New', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  PREPARING: { label: 'Preparing', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  READY: { label: 'Ready', color: 'bg-green-100 text-green-800 border-green-200' },
  COMPLETED: { label: 'Completed', color: 'bg-gray-100 text-gray-800 border-gray-200' },
  CANCELLED: { label: 'Cancelled', color: 'bg-red-100 text-red-800 border-red-200' }
};

const statusOrder = ['NEW', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED'];

export default function OrdersList() {
  const outlet = useAuthStore((s) => s.outlet);
  const { organizationId, outletId } = getTenantContext(outlet);
  const [allOrders, setAllOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateRange, setDateRange] = useState('today');

  const fetchOrders = useCallback(async () => {
    if (!organizationId || !outletId) return;
    setLoading(true);
    try {
      const res = await apiService.listOrders({ organizationId, outletId });
      setAllOrders(res.data.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [organizationId, outletId]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Auto-refresh every 15 seconds
  useEffect(() => {
    const interval = setInterval(fetchOrders, 15000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  // Client-side filtering
  const filteredOrders = useMemo(() => {
    let data = [...allOrders];

    if (statusFilter) {
      data = data.filter(o => o.order_status === statusFilter);
    }

    if (search) {
      const term = search.toLowerCase();
      data = data.filter(o =>
        o.order_no?.toLowerCase().includes(term) ||
        o.customer_name?.toLowerCase().includes(term) ||
        o.table_number?.toLowerCase().includes(term) ||
        o.token_number?.toLowerCase().includes(term)
      );
    }

    if (dateRange !== 'all') {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(todayStart.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(todayStart.getTime() - 30 * 24 * 60 * 60 * 1000);
      data = data.filter(o => {
        const orderDate = new Date(o.created_at);
        if (dateRange === 'today') return orderDate >= todayStart;
        if (dateRange === 'week') return orderDate >= weekAgo;
        if (dateRange === 'month') return orderDate >= monthAgo;
        return true;
      });
    }

    return data;
  }, [allOrders, statusFilter, search, dateRange]);

  // Stats (including cancelled)
  const stats = useMemo(() => {
    const total = filteredOrders.length;
    const pending = filteredOrders.filter(o => o.order_status === 'NEW' || o.order_status === 'PREPARING').length;
    const ready = filteredOrders.filter(o => o.order_status === 'READY').length;
    const cancelled = filteredOrders.filter(o => o.order_status === 'CANCELLED').length;
    const settlementPending = filteredOrders.filter(o => 
      o.order_status === 'COMPLETED' && o.payment_status !== 'PAID'
    ).length;
    return { total, pending, ready, cancelled, settlementPending };
  }, [filteredOrders]);

  // Selected order
  const selectedOrder = useMemo(
    () => filteredOrders.find(o => o.id === selectedOrderId),
    [filteredOrders, selectedOrderId]
  );

  // Auto-select first order
  useEffect(() => {
    if (filteredOrders.length > 0 && !selectedOrderId) {
      setSelectedOrderId(filteredOrders[0].id);
    }
  }, [filteredOrders, selectedOrderId]);

  // If selected order disappears
  useEffect(() => {
    if (selectedOrderId && !filteredOrders.some(o => o.id === selectedOrderId)) {
      setSelectedOrderId(filteredOrders[0]?.id ?? null);
    }
  }, [filteredOrders, selectedOrderId]);

  const handleStatusUpdate = async (orderId, newStatus) => {
    const order = allOrders.find(o => o.id === orderId);
    if (newStatus === 'COMPLETED' && order && order.payment_status !== 'PAID') {
      toast.error('Complete order only after payment settlement');
      return;
    }
    try {
      await apiService.updateOrderStatus(orderId, newStatus);
      toast.success(`Order ${newStatus === 'CANCELLED' ? 'cancelled' : 'updated'}`);
      fetchOrders();
    } catch (err) {
      toast.error('Failed to update order');
    }
  };

  const handleSettle = async (orderId, paymentMethod) => {
    try {
      await apiService.settleOrder(orderId, paymentMethod);
      toast.success('Order settled');
      fetchOrders();
    } catch (err) {
      toast.error('Settlement failed');
    }
  };

  if (loading && allOrders.length === 0) {
    return (
      <div className="p-6">
        <Skeleton className="h-10 w-48 mb-4" />
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="text-sm text-gray-500">Manage preparation, settlement, and fulfillment</p>
        </div>
        <div className="flex gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm bg-white"
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
        </div>
      </div>

      {/* Compact KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
        <div className="bg-white rounded-xl border p-3 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-50 rounded-full"><ShoppingBag className="h-4 w-4 text-indigo-600" /></div>
            <div><p className="text-xs text-gray-500">Orders Today</p><p className="text-xl font-bold">{stats.total}</p></div>
          </div>
        </div>
        <div className="bg-white rounded-xl border p-3 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-orange-50 rounded-full"><Clock className="h-4 w-4 text-orange-600" /></div>
            <div><p className="text-xs text-gray-500">Pending</p><p className="text-xl font-bold text-orange-600">{stats.pending}</p></div>
          </div>
        </div>
        <div className="bg-white rounded-xl border p-3 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-green-50 rounded-full"><CheckCircle className="h-4 w-4 text-green-600" /></div>
            <div><p className="text-xs text-gray-500">Ready</p><p className="text-xl font-bold text-green-600">{stats.ready}</p></div>
          </div>
        </div>
        <div className="bg-white rounded-xl border p-3 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-red-50 rounded-full"><XCircle className="h-4 w-4 text-red-600" /></div>
            <div><p className="text-xs text-gray-500">Cancelled</p><p className="text-xl font-bold text-red-600">{stats.cancelled}</p></div>
          </div>
        </div>
        <div className="bg-white rounded-xl border p-3 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-yellow-50 rounded-full"><Wallet className="h-4 w-4 text-yellow-600" /></div>
            <div><p className="text-xs text-gray-500">Settlement Pending</p><p className="text-xl font-bold text-yellow-600">{stats.settlementPending}</p></div>
          </div>
        </div>
      </div>

      {/* Filters – instant */}
      <div className="bg-white rounded-xl border p-4 mb-6 flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-medium text-gray-500 mb-1">Search</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Order #, customer, table, token..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm"
            />
          </div>
        </div>
        <div className="w-48">
          <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm"
          >
            <option value="">All</option>
            {statusOrder.map(s => <option key={s} value={s}>{statusConfig[s].label}</option>)}
          </select>
        </div>
      </div>

      {/* Main two-column layout */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Orders List – compact cards */}
        <div className="flex-1 min-w-0">
          <div className="mb-2 text-sm text-gray-500">{filteredOrders.length} order(s) found</div>
          <div className="bg-white rounded-xl border overflow-hidden">
            <div className="divide-y divide-gray-100">
              {filteredOrders.length === 0 ? (
                <div className="py-16 px-4 text-center">
                  <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <Coffee className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-1">No Orders Yet</h3>
                  <p className="text-sm text-gray-500 max-w-sm mx-auto">
                    Orders created from Captain, QR ordering, and POS will appear here automatically.
                  </p>
                </div>
              ) : (
                filteredOrders.map(order => {
                  const config = statusConfig[order.order_status] || statusConfig.NEW;
                  const ageText = order.order_status === 'NEW' ? getAgeText(order.created_at) : null;
                  const isOverdue = order.order_status === 'NEW' && ageText && parseInt(ageText) > 1;
                  const itemCount = order.items?.length || 0;
                  const displayCustomer = order.customer_name || (order.order_source === 'DINE_IN' && order.table_number ? `Table ${order.table_number}` : orderSourceLabel[order.order_source]);
                  return (
                    <div
                      key={order.id}
                      className={`p-4 hover:bg-gray-50 cursor-pointer transition ${selectedOrderId === order.id ? 'bg-indigo-50 border-l-4 border-indigo-500' : 'border-l-4 border-transparent'}`}
                      onClick={() => setSelectedOrderId(order.id)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-sm font-medium">{order.order_no}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${config.color}`}>
                              {config.label}
                            </span>
                            {ageText && (
                              <span className={`text-xs px-2 py-0.5 rounded-full ${isOverdue ? 'bg-red-100 text-red-800 animate-pulse' : 'bg-gray-100 text-gray-600'}`}>
                                {ageText}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {displayCustomer} • {formatTime(order.created_at)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-gray-900">₹{Number(order.grand_total).toFixed(0)}</div>
                          <div className="text-xs text-gray-500">{itemCount} item(s)</div>
                          <div className="text-xs text-gray-500">{order.payment_method || '-'}</div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Order Detail Panel */}
        <div className="w-full lg:w-96 flex-shrink-0">
          {selectedOrder ? (
            <div className="bg-white rounded-xl border shadow-sm sticky top-6">
              {/* Header */}
              <div className="border-b p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-semibold">{selectedOrder.order_no}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${statusConfig[selectedOrder.order_status]?.color || 'bg-gray-100'}`}>
                        {statusConfig[selectedOrder.order_status]?.label || selectedOrder.order_status}
                      </span>
                    </div>
                    <div className="text-2xl font-bold mt-2">₹{Number(selectedOrder.grand_total).toFixed(2)}</div>
                  </div>
                  <div>
                    {selectedOrder.payment_status !== 'PAID' && (
                      <span className="inline-flex items-center gap-1 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                        <AlertCircle className="h-3 w-3" /> Settlement Pending
                      </span>
                    )}
                    {selectedOrder.payment_status === 'PAID' && (
                      <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                        <CheckCircle className="h-3 w-3" /> Settled
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-4 space-y-4">
                {/* Order details – reordered */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Source</span>
                    <span className="font-medium">{orderSourceLabel[selectedOrder.order_source] || selectedOrder.order_source}</span>
                  </div>
                  {selectedOrder.customer_name && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Customer</span>
                      <span className="font-medium">{selectedOrder.customer_name}</span>
                    </div>
                  )}
                  {selectedOrder.order_source === 'DINE_IN' && selectedOrder.table_number && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Table</span>
                      <span className="font-medium">{selectedOrder.table_number}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-500">Payment</span>
                    <span className="font-medium">{selectedOrder.payment_method || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Settlement</span>
                    <span className="font-medium">{selectedOrder.payment_status === 'PAID' ? 'Paid' : 'Pending'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Created</span>
                    <span className="font-medium">{formatTime(selectedOrder.created_at)}</span>
                  </div>
                </div>

                {/* Items */}
                {selectedOrder.items && selectedOrder.items.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-800 mb-2">Items</h4>
                    <div className="space-y-1 text-sm">
                      {selectedOrder.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between">
                          <span>{item.quantity}x {item.itemName}</span>
                          <span>₹{Number(item.lineTotal).toFixed(0)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="pt-2 border-t space-y-2">
                  {selectedOrder.order_status === 'NEW' && (
                    <>
                      <Button onClick={() => handleStatusUpdate(selectedOrder.id, 'PREPARING')} className="w-full">
                        Start Preparing
                      </Button>
                      <Button onClick={() => handleStatusUpdate(selectedOrder.id, 'CANCELLED')} variant="danger" className="w-full">
                        Cancel Order
                      </Button>
                    </>
                  )}
                  {selectedOrder.order_status === 'PREPARING' && (
                    <Button onClick={() => handleStatusUpdate(selectedOrder.id, 'READY')} className="w-full">
                      Mark Ready
                    </Button>
                  )}
                  {selectedOrder.order_status === 'READY' && (
                    <Button
                      onClick={() => handleStatusUpdate(selectedOrder.id, 'COMPLETED')}
                      className="w-full"
                      disabled={selectedOrder.payment_status !== 'PAID'}
                      title={selectedOrder.payment_status !== 'PAID' ? "Complete only after payment settlement" : ""}
                    >
                      Complete Order
                    </Button>
                  )}
                  {selectedOrder.order_status === 'COMPLETED' && selectedOrder.payment_status !== 'PAID' && (
                    <div className="space-y-2">
                      <Button onClick={() => handleSettle(selectedOrder.id, 'CASH')} className="w-full">
                        Settle Cash
                      </Button>
                      <Button onClick={() => handleSettle(selectedOrder.id, 'UPI')} className="w-full">
                        Settle UPI
                      </Button>
                      <Button onClick={() => handleSettle(selectedOrder.id, 'CARD')} className="w-full">
                        Settle Card
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border p-6 text-center text-gray-400">
              <p className="text-sm">Select an order to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}