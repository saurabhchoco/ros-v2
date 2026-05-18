import { useEffect, useState } from 'react';
import { apiService } from '../services/api';
import './Reports.css';

export default function Reports({ outlet }) {
  const [summary, setSummary] = useState(null);
  const [rangeData, setRangeData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Get today's summary
        const summaryResponse = await apiService.getSummary();
        setSummary(summaryResponse.data.data);

        // Get date range
        const rangeResponse = await apiService.getByDateRange(startDate, endDate);
        setRangeData(rangeResponse.data.data || []);
      } catch (error) {
        console.error('Failed to fetch reports:', error);
        alert('Failed to load reports');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [startDate, endDate]);

  if (loading) {
    return <div className="loading">Loading reports...</div>;
  }

  const totalRevenue = rangeData.reduce((sum, day) => sum + parseFloat(day.totalRevenue || 0), 0);
  const totalOrders = rangeData.reduce((sum, day) => sum + day.totalOrders, 0);
  const avgValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  return (
    <div className="reports-container">
      <div className="reports-header">
        <h2>Reports</h2>
      </div>

      {/* Today's Summary */}
      {summary && (
        <div className="summary-card">
          <h3>Today's Summary</h3>
          <div className="metrics-grid">
            <div className="metric">
              <label>Total Orders</label>
              <div className="value">{summary.totalOrders}</div>
            </div>
            <div className="metric">
              <label>Total Revenue</label>
              <div className="value">₹{parseFloat(summary.totalRevenue).toFixed(2)}</div>
            </div>
            <div className="metric">
              <label>Avg Order Value</label>
              <div className="value">₹{parseFloat(summary.avgOrderValue).toFixed(2)}</div>
            </div>
            <div className="metric">
              <label>Completed</label>
              <div className="value">{summary.completedOrders}</div>
            </div>
            <div className="metric">
              <label>In Progress</label>
              <div className="value">{summary.preparingOrders}</div>
            </div>
            <div className="metric">
              <label>New</label>
              <div className="value">{summary.newOrders}</div>
            </div>
          </div>
        </div>
      )}

      {/* Date Range Filter */}
      <div className="filter-section">
        <h3>Period Analysis</h3>
        <div className="date-filters">
          <div className="date-input">
            <label>From</label>
            <input 
              type="date" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="date-input">
            <label>To</label>
            <input 
              type="date" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Range Summary */}
      <div className="range-summary">
        <div className="range-metric">
          <label>Period Revenue</label>
          <div className="value">₹{totalRevenue.toFixed(2)}</div>
        </div>
        <div className="range-metric">
          <label>Period Orders</label>
          <div className="value">{totalOrders}</div>
        </div>
        <div className="range-metric">
          <label>Avg per Order</label>
          <div className="value">₹{avgValue.toFixed(2)}</div>
        </div>
      </div>

      {/* Daily Breakdown Table */}
      <table className="daily-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Orders</th>
            <th>Revenue</th>
            <th>Avg Value</th>
            <th>Completed</th>
          </tr>
        </thead>
        <tbody>
          {rangeData.map((day, idx) => (
            <tr key={idx}>
              <td>{new Date(day.date).toLocaleDateString()}</td>
              <td>{day.totalOrders}</td>
              <td>₹{parseFloat(day.totalRevenue).toFixed(2)}</td>
              <td>
                ₹{day.totalOrders > 0
                  ? (parseFloat(day.totalRevenue) /
                    day.totalOrders).toFixed(2)
                  : '0.00'}
              </td>
              <td>{day.completedOrders}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {rangeData.length === 0 && (
        <div className="empty-state">
          No data for selected period
        </div>
      )}
    </div>
  );
}