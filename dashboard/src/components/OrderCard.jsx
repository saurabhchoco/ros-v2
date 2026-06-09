// dashboard/src/components/OrderCard.jsx
import { useState, useEffect, useRef } from 'react';
import { apiService } from '../services/api';
import { Package, X } from 'lucide-react';

// Simple cache for order items (clears on page reload)
const itemsCache = new Map();

function useElapsedTime(createdAt) {
  const [elapsed, setElapsed] = useState({ mins: 0, secs: 0 });
  useEffect(() => {
    const created = createdAt ? new Date(createdAt).getTime() : Date.now();
    const tick = () => {
      const totalSeconds = Math.floor((Date.now() - created) / 1000);
      const mins = Math.floor(totalSeconds / 60);
      const secs = totalSeconds % 60;
      setElapsed({ mins, secs });
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [createdAt]);
  return elapsed;
}

// Cancel Reason Modal Component
const CancelReasonModal = ({ isOpen, onClose, onConfirm }) => {
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setSubmitting(true);
    await onConfirm(reason);
    setSubmitting(false);
    setReason('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-900">Cancel Order</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="text-sm text-gray-600 mb-3">Please provide a reason for cancellation (optional):</p>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g., Customer changed mind, Out of stock, etc."
          rows={3}
          className="w-full border rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          autoFocus
        />
        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 bg-gray-200 rounded-lg text-sm font-medium hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={submitting}
            className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 flex items-center gap-2"
          >
            {submitting && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
            Confirm Cancellation
          </button>
        </div>
      </div>
    </div>
  );
};

export default function OrderCard({
  order,
  nextLabel,
  nextStatus,
  btnColor,
  onStatusChange,
  onCancel,
}) {
  const [updating, setUpdating] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [items, setItems] = useState(null);
  const [loadingItems, setLoadingItems] = useState(false);
  const { mins: elapsedMins, secs: elapsedSecs } = useElapsedTime(order.createdAt);
  const staleSoundPlayed = useRef(false);

  const isStaleNew = order.orderStatus === 'NEW' && elapsedMins >= 1;

  useEffect(() => {
    if (isStaleNew && !staleSoundPlayed.current) {
      staleSoundPlayed.current = true;
      const audio = new Audio('/sounds/alert.mp3');
      audio.play().catch(e => console.log('Audio play failed:', e));
    }
  }, [isStaleNew]);

  const timerColor =
    elapsedMins >= 10
      ? 'bg-red-100 text-red-700'
      : elapsedMins >= 5
      ? 'bg-yellow-100 text-yellow-700'
      : 'bg-green-100 text-green-700';

  const handleClick = async () => {
    setUpdating(true);
    try {
      await onStatusChange(order.id, nextStatus);
    } finally {
      setUpdating(false);
    }
  };

  const handleCancelClick = () => {
    setShowCancelModal(true);
  };

  const handleConfirmCancel = async (reason) => {
    setCancelling(true);
    try {
      await onCancel(order.id, reason);
    } finally {
      setCancelling(false);
    }
  };

  const time = order.createdAt
    ? new Date(order.createdAt).toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  const pulseClass = isStaleNew ? 'animate-pulse-red ring-4 ring-red-500 shadow-xl' : '';

  // Determine left border class based on status and overdue
  let leftBorderClass = 'border-l-4 border-gray-200'; // default white/light gray
  if (order.orderStatus === 'NEW') {
    leftBorderClass = isStaleNew
      ? 'border-l-4 border-red-500'
      : 'border-l-4 border-gray-200';
  } else if (order.orderStatus === 'PREPARING') {
    leftBorderClass = 'border-l-4 border-amber-500';
  } else if (order.orderStatus === 'READY') {
    leftBorderClass = 'border-l-4 border-indigo-400';
  }

  // Fetch items if not already cached
  useEffect(() => {
    if (!order.id) return;
    if (itemsCache.has(order.id)) {
      setItems(itemsCache.get(order.id));
      return;
    }
    setLoadingItems(true);
    apiService.getOrder(order.id)
      .then(res => {
        const orderData = res.data.data;
        const orderItems = orderData.items || orderData.orderItems || [];
        itemsCache.set(order.id, orderItems);
        setItems(orderItems);
      })
      .catch(err => {
        console.error('Failed to fetch order items:', err);
        setItems([]);
      })
      .finally(() => setLoadingItems(false));
  }, [order.id]);

  const totalItems = items?.reduce((sum, i) => sum + (i.quantity || 0), 0) || 0;

  return (
    <>
      <div
        className={`bg-white rounded-2xl shadow-md ${leftBorderClass} p-5 transition-all ${pulseClass}`}
      >
        {/* Header: order number & time */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="font-bold text-gray-800 text-lg leading-tight">{order.orderNo}</p>
            {time && <p className="text-gray-400 text-xs mt-0.5">{time}</p>}
          </div>
          <span className={`${timerColor} text-xs font-bold px-2 py-1 rounded-lg`}>
            {elapsedMins}:{elapsedSecs.toString().padStart(2, '0')}
          </span>
        </div>

        {/* Order source */}
        <p className="uppercase text-xs tracking-widest text-gray-400 font-semibold mb-2">
          {order.orderSource || 'DINE IN'}
        </p>

        {/* Amount & total item count */}
        <p className="text-indigo-500 font-extrabold text-3xl mb-1">
          ₹{parseFloat(order.grandTotal || 0).toFixed(0)}
        </p>
        {totalItems > 0 && (
          <p className="text-sm font-semibold text-gray-600 mb-3">
            {totalItems} {totalItems === 1 ? 'Item' : 'Items'}
          </p>
        )}

        {/* Tags (table, token, customer, payment) */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {order.tableNumber && (
            <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-md font-medium">
              🪑 Table {order.tableNumber}
            </span>
          )}
          {order.tokenNumber && (
            <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-md font-medium">
              🎫 Token {order.tokenNumber}
            </span>
          )}
          {order.customerName && (
            <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-md font-medium">
              👤 {order.customerName}
            </span>
          )}
          {order.paymentMethod && (
            <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-md font-medium">
              💳 {order.paymentMethod}
            </span>
          )}
        </div>

        {/* Items List */}
        <div className="mb-4">
          {loadingItems ? (
            <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 text-center text-gray-400 text-sm">
              Loading items...
            </div>
          ) : items && items.length > 0 ? (
            <div className="space-y-2 bg-gray-50 rounded-xl p-3 border border-gray-100">
              {items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center">
                  <div>
                    <span className="font-medium text-gray-800">{item.quantity}x</span>
                    <span className="ml-2 text-gray-600">{item.itemName || item.name}</span>
                  </div>
                  {item.instructions && (
                    <span className="text-xs text-gray-400 italic">{item.instructions}</span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-gray-400 text-sm bg-gray-50 rounded-xl p-3 border border-gray-100">
              <Package className="h-4 w-4" />
              <span>No items</span>
            </div>
          )}
        </div>

        {/* Action button */}
        <button
          onClick={handleClick}
          disabled={updating}
          className={`w-full ${btnColor} text-white rounded-xl py-3 font-bold text-sm transition-all disabled:opacity-50`}
        >
          {updating ? 'Updating...' : nextLabel}
        </button>

        {/* Cancel button – only shown if onCancel provided and order not already completed/cancelled */}
        {onCancel && (order.orderStatus === 'NEW' || order.orderStatus === 'PREPARING') && (
          <button
            onClick={handleCancelClick}
            disabled={cancelling}
            className="w-full mt-2 bg-red-500 text-white rounded-xl py-2 font-bold text-sm transition-all hover:bg-red-600 disabled:opacity-50"
          >
            {cancelling ? 'Cancelling...' : 'Cancel Order'}
          </button>
        )}
      </div>

      {/* Cancel Reason Modal */}
      <CancelReasonModal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={handleConfirmCancel}
      />
    </>
  );
}