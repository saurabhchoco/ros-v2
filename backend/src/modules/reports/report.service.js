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

// Helper to get date interval based on period string
function getDateInterval(period) {
  switch (period) {
    case 'week': return "7 days";
    case 'month': return "30 days";
    default: return "1 day";
  }
}

async function getBrandAnalytics(organizationId, period = 'day') {
  const interval = getDateInterval(period);

  // Main metrics
  const mainQuery = `
    SELECT
      COALESCE(SUM(grand_total), 0) AS total_revenue,
      COUNT(*) AS total_orders,
      COALESCE(AVG(grand_total), 0) AS avg_order_value
    FROM orders
    WHERE organization_id = $1
      AND created_at >= NOW() - $2::interval
  `;
  const mainResult = await pool.query(mainQuery, [organizationId, interval]);

  // Top 5 items
  const topItemsQuery = `
    SELECT
      oi.item_name,
      SUM(oi.quantity) AS total_quantity,
      SUM(oi.line_total) AS total_revenue
    FROM order_items oi
    JOIN orders o ON oi.order_id = o.id
    WHERE o.organization_id = $1
      AND o.created_at >= NOW() - $2::interval
    GROUP BY oi.item_name
    ORDER BY total_revenue DESC
    LIMIT 5
  `;
  const topItemsResult = await pool.query(topItemsQuery, [organizationId, interval]);

  // Outlet‑level summary (for the aggregated view)
  const outletsQuery = `
    SELECT
      o.id,
      o.name,
      COUNT(ord.id) AS order_count,
      COALESCE(SUM(ord.grand_total), 0) AS revenue
    FROM outlets o
    LEFT JOIN orders ord ON ord.outlet_id = o.id
      AND ord.organization_id = $1
      AND ord.created_at >= NOW() - $2::interval
    WHERE o.organization_id = $1
    GROUP BY o.id, o.name
    ORDER BY revenue DESC
  `;
  const outletsResult = await pool.query(outletsQuery, [organizationId, interval]);

  return {
    period,
    totalRevenue: parseFloat(mainResult.rows[0].total_revenue),
    totalOrders: parseInt(mainResult.rows[0].total_orders),
    avgOrderValue: parseFloat(mainResult.rows[0].avg_order_value),
    topItems: topItemsResult.rows.map(row => ({
      name: row.item_name,
      quantity: parseInt(row.total_quantity),
      revenue: parseFloat(row.total_revenue)
    })),
    outlets: outletsResult.rows.map(row => ({
      id: row.id,
      name: row.name,
      orderCount: parseInt(row.order_count),
      revenue: parseFloat(row.revenue)
    }))
  };
}

async function getOutletAnalytics(outletId, organizationId, period = 'day') {
  const interval = getDateInterval(period);
  const query = `
    SELECT
      COALESCE(SUM(grand_total), 0) AS total_revenue,
      COUNT(*) AS total_orders,
      COALESCE(AVG(grand_total), 0) AS avg_order_value
    FROM orders
    WHERE outlet_id = $1
      AND organization_id = $2
      AND created_at >= NOW() - $3::interval
  `;
  const result = await pool.query(query, [outletId, organizationId, interval]);

  // Top items for this outlet
  const topItemsQuery = `
    SELECT
      oi.item_name,
      SUM(oi.quantity) AS total_quantity,
      SUM(oi.line_total) AS total_revenue
    FROM order_items oi
    JOIN orders o ON oi.order_id = o.id
    WHERE o.outlet_id = $1
      AND o.organization_id = $2
      AND o.created_at >= NOW() - $3::interval
    GROUP BY oi.item_name
    ORDER BY total_revenue DESC
    LIMIT 5
  `;
  const topItemsResult = await pool.query(topItemsQuery, [outletId, organizationId, interval]);

  return {
    period,
    totalRevenue: parseFloat(result.rows[0].total_revenue),
    totalOrders: parseInt(result.rows[0].total_orders),
    avgOrderValue: parseFloat(result.rows[0].avg_order_value),
    topItems: topItemsResult.rows.map(row => ({
      name: row.item_name,
      quantity: parseInt(row.total_quantity),
      revenue: parseFloat(row.total_revenue)
    }))
  };
}

module.exports = {
  getSummaryReport,
  getDateRangeReport,
  getBrandAnalytics,
  getOutletAnalytics
};