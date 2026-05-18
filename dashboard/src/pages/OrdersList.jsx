import { useEffect, useState } from 'react';
import { apiService } from '../services/api';
import './OrdersList.css';

export default function OrdersList({ outlet }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await apiService.listOrders({ 
          status: statusFilter || undefined 
        });
        setOrders(response.data.data || []);
      } catch (error) {
        console.error('Failed to fetch orders:', error);
        alert('Failed to load orders');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [statusFilter]);

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleString();
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await apiService.updateOrderStatus(orderId, newStatus);
      // Refresh list
      const response = await apiService.listOrders({ 
        status: statusFilter || undefined 
      });
      setOrders(response.data.data || []);
    } catch (error) {
      console.error('Failed to update status:', error);
      alert('Failed to update order');
    }
  };

  const getStatusBadgeColor = (status) => {
    switch(status) {
      case 'NEW': return '#ff6b6b';
      case 'PREPARING': return '#ffd43b';
      case 'READY': return '#51cf66';
      case 'COMPLETED': return '#339af0';
      case 'CANCELLED': return '#a6a6a6';
      default: return '#868e96';
    }
  };

  if (loading) {
    return <div className="loading">Loading orders...</div>;
  }

  return (
    <div className="orders-container">
      <div className="orders-header">
        <h2>Orders</h2>
        
        <div className="filter-group">
          <label>Status Filter:</label>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All</option>
            <option value="NEW">New</option>
            <option value="PREPARING">Preparing</option>
            <option value="READY">Ready</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      <table className="orders-table">
        <thead>
          <tr>
            <th>Order #</th>
            <th>Source</th>
            <th>Time</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Items</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {orders.map(order => (
            <tr key={order.id}>
              <td><strong>{order.order_no}</strong></td>
              <td>{order.order_source}</td>
              <td>{formatDate(order.created_at)}</td>
              <td>₹{parseFloat(order.grand_total).toFixed(2)}</td>
              <td>
                <span 
                  className="status-badge"
                  style={{ backgroundColor: getStatusBadgeColor(order.order_status) }}
                >
                  {order.order_status}
                </span>
              </td>
              <td>{order.items?.length || 0} items</td>
              <td>
                {order.order_status !== 'COMPLETED' && order.order_status !== 'CANCELLED' && (
                  <button 
                    className="action-btn"
                    onClick={() => {
                      const nextStatus = 
                        order.order_status === 'NEW' ? 'PREPARING' :
                        order.order_status === 'PREPARING' ? 'READY' :
                        order.order_status === 'READY' ? 'COMPLETED' : null;
                      
                      if (nextStatus) handleStatusChange(order.id, nextStatus);
                    }}
                  >
                    Next
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {orders.length === 0 && (
        <div className="empty-state">
          No orders found
        </div>
      )}
    </div>
  );
}