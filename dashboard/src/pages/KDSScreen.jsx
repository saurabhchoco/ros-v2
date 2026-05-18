import { useEffect, useState } from 'react';
import { kdsService } from '../services/firebase';
import { apiService } from '../services/api';
import OrderCard from '../components/OrderCard';
import './KDSScreen.css';

export default function KDSScreen({ outlet }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Subscribe to real-time updates from Firestore
    const unsubscribe = kdsService.subscribeToActiveOrders(
      outlet.organizationId,
      outlet.outletId,
      (activeOrders) => {
        setOrders(activeOrders);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [outlet]);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await apiService.updateOrderStatus(orderId, newStatus);
      // Firestore listener will update UI automatically
    } catch (error) {
      console.error('Failed to update status:', error);
      alert('Failed to update order status');
    }
  };

  // Group orders by status
  const groupedOrders = {
    NEW: orders.filter(o => o.orderStatus === 'NEW'),
    PREPARING: orders.filter(o => o.orderStatus === 'PREPARING'),
    READY: orders.filter(o => o.orderStatus === 'READY')
  };

  if (loading) {
    return <div className="loading">Loading KDS...</div>;
  }

  return (
    <div className="kds-container">
      <div className="kds-header">
        <h2>{outlet.outletName} — Kitchen Display System</h2>
        <div className="order-count">
          {orders.length} active orders
        </div>
      </div>

      <div className="kanban-board">
        {/* NEW Column */}
        <div className="kanban-column new-column">
          <div className="column-header">
            <h3>🆕 New Orders</h3>
            <span className="badge">{groupedOrders.NEW.length}</span>
          </div>
          <div className="card-stack">
            {groupedOrders.NEW.map(order => (
              <OrderCard
                key={order.id}
                order={order}
                onStatusChange={handleStatusChange}
                nextStatus="PREPARING"
              />
            ))}
          </div>
        </div>

        {/* PREPARING Column */}
        <div className="kanban-column preparing-column">
          <div className="column-header">
            <h3>👨‍🍳 Preparing</h3>
            <span className="badge">{groupedOrders.PREPARING.length}</span>
          </div>
          <div className="card-stack">
            {groupedOrders.PREPARING.map(order => (
              <OrderCard
                key={order.id}
                order={order}
                onStatusChange={handleStatusChange}
                nextStatus="READY"
              />
            ))}
          </div>
        </div>

        {/* READY Column */}
        <div className="kanban-column ready-column">
          <div className="column-header">
            <h3>✅ Ready</h3>
            <span className="badge">{groupedOrders.READY.length}</span>
          </div>
          <div className="card-stack">
            {groupedOrders.READY.map(order => (
              <OrderCard
                key={order.id}
                order={order}
                onStatusChange={handleStatusChange}
                nextStatus="COMPLETED"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}