const pool = require('../../config/db');

async function getSummaryReport(
  organizationId,
  outletId,
  date
) {

  const dateStr = date || new Date().toISOString().split('T')[0];

  const result = await pool.query(
    `
    SELECT 
      COUNT(id) as total_orders,
      SUM(grand_total) as total_revenue,
      AVG(grand_total) as avg_order_value,
      COUNT(CASE WHEN order_status = 'COMPLETED' THEN 1 END) as completed_orders,
      COUNT(CASE WHEN order_status = 'NEW' THEN 1 END) as new_orders,
      COUNT(CASE WHEN order_status = 'PREPARING' THEN 1 END) as preparing_orders
    FROM orders
    WHERE organization_id = $1
    AND outlet_id = $2
    AND DATE(created_at) = $3::date
    `,
    [organizationId, outletId, dateStr]
  );

  const row = result.rows[0];

  return {
    date: dateStr,
    totalOrders: parseInt(row.total_orders || 0),
    totalRevenue: parseFloat(row.total_revenue || 0),
    avgOrderValue: parseFloat(row.avg_order_value || 0),
    completedOrders: parseInt(row.completed_orders || 0),
    newOrders: parseInt(row.new_orders || 0),
    preparingOrders: parseInt(row.preparing_orders || 0)
  };

}

async function getDateRangeReport(
  organizationId,
  outletId,
  startDate,
  endDate
) {

  const result = await pool.query(
    `
    SELECT 
      DATE(created_at) as date,
      COUNT(id) as total_orders,
      SUM(grand_total) as total_revenue,
      AVG(grand_total) as avg_order_value,
      COUNT(CASE WHEN order_status = 'COMPLETED' THEN 1 END) as completed_orders
    FROM orders
    WHERE organization_id = $1
    AND outlet_id = $2
    AND DATE(created_at) BETWEEN $3::date AND $4::date
    GROUP BY DATE(created_at)
    ORDER BY DATE(created_at) DESC
    `,
    [organizationId, outletId, startDate, endDate]
  );

  return result.rows.map(row => ({
    date: row.date,
    totalOrders: parseInt(row.total_orders || 0),
    totalRevenue: parseFloat(row.total_revenue || 0),
    avgOrderValue: parseFloat(row.avg_order_value || 0),
    completedOrders: parseInt(row.completed_orders || 0)
  }));

}

module.exports = {
  getSummaryReport,
  getDateRangeReport
};