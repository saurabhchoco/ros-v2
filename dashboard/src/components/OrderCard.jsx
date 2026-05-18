export default function OrderCard({ order, onStatusChange }) {
  return (
    <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="flex justify-between items-start mb-3">
        <div>
          <p className="font-bold text-gray-900">{order.orderNo}</p>
          <p className="text-sm text-gray-600">{order.customerName || 'Walk-in'}</p>
        </div>
        <span className="text-lg font-bold text-blue-600">₹{order.grandTotal || 0}</span>
      </div>
      
      <div className="text-sm text-gray-700 mb-3 border-t pt-2">
        {order.items?.length || 0} items
      </div>

      <button
        onClick={() => {
          const nextStatus = order.orderStatus === 'NEW' ? 'PREPARING' : 'READY';
          onStatusChange(order.id, nextStatus);
        }}
        className="w-full px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
      >
        Move to {order.orderStatus === 'NEW' ? 'Preparing' : 'Ready'}
      </button>
    </div>
  );
}
