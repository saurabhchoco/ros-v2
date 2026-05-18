import './OrderCard.css';

export default function OrderCard({ order, onStatusChange, nextStatus }) {
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'NEW': return '#ff6b6b';
      case 'PREPARING': return '#ffd43b';
      case 'READY': return '#51cf66';
      case 'COMPLETED': return '#339af0';
      default: return '#868e96';
    }
  };

  return (
    <div className="order-card" style={{ borderTopColor: getStatusColor(order.orderStatus) }}>
      <div className="card-header">
        <div className="order-number">
          {order.orderNo}
        </div>
        <div className="order-time">
          {formatTime(order.createdAt)}
        </div>
      </div>

      <div className="card-body">
        <div className="order-source">
          {order.orderSource}
        </div>
        <div className="order-total">
          ₹{parseFloat(order.grandTotal).toFixed(2)}
        </div>
      </div>

      <div className="card-action">
        <button 
          className="action-button"
          onClick={() => onStatusChange(order.id, nextStatus)}
        >
          {nextStatus === 'PREPARING' && 'Start Preparing'}
          {nextStatus === 'READY' && 'Mark Ready'}
          {nextStatus === 'COMPLETED' && 'Complete'}
        </button>
      </div>
    </div>
  );
}