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

async function getKitchenStats(organizationId, outletId) {
  const today = new Date().toISOString().split('T')[0];
  // Completed today
  const completedQuery = `
    SELECT COUNT(*) as completed
    FROM orders
    WHERE organization_id = $1 AND outlet_id = $2
      AND order_status = 'COMPLETED'
      AND DATE(created_at) = $3
  `;
  const completedRes = await pool.query(completedQuery, [organizationId, outletId, today]);

  // Average preparation time (from NEW to COMPLETED/READY) in last 24h
  const prepQuery = `
    SELECT AVG(EXTRACT(EPOCH FROM (updated_at - created_at)) / 60) as avg_minutes
    FROM orders
    WHERE organization_id = $1 AND outlet_id = $2
      AND order_status IN ('COMPLETED', 'READY')
      AND created_at >= NOW() - INTERVAL '24 hours'
  `;
  const prepRes = await pool.query(prepQuery, [organizationId, outletId]);

  return {
    completedToday: parseInt(completedRes.rows[0].completed || 0),
    avgPrepTime: Math.round(parseFloat(prepRes.rows[0].avg_minutes || 0)),
  };
}

// Revenue trend (last 7 days)
async function getRevenueTrend(organizationId) {
  const result = await pool.query(`
    SELECT DATE(created_at) as date, COALESCE(SUM(grand_total), 0) as revenue
    FROM orders
    WHERE organization_id = $1 AND created_at >= NOW() - INTERVAL '7 days'
    GROUP BY DATE(created_at)
    ORDER BY date ASC
  `, [organizationId]);
  return result.rows.map(row => ({
    date: row.date.toISOString().slice(0,10),
    revenue: parseFloat(row.revenue)
  }));
}

// Order status distribution
async function getOrderStatusDistribution(organizationId) {
  const result = await pool.query(`
    SELECT order_status, COUNT(*) as count
    FROM orders
    WHERE organization_id = $1
    GROUP BY order_status
  `, [organizationId]);
  return result.rows.map(row => ({ status: row.order_status, count: parseInt(row.count) }));
}

// Outlet comparison
async function getOutletComparison(organizationId) {
  const result = await pool.query(`
    SELECT o.id, o.name,
      COUNT(ord.id) as order_count,
      COALESCE(SUM(ord.grand_total), 0) as revenue,
      COALESCE(AVG(ord.grand_total), 0) as avg_order_value,
      COUNT(CASE WHEN ord.order_status IN ('NEW','PREPARING') THEN 1 END) as pending_orders
    FROM outlets o
    LEFT JOIN orders ord ON ord.outlet_id = o.id AND ord.organization_id = o.organization_id
    WHERE o.organization_id = $1
    GROUP BY o.id, o.name
    ORDER BY revenue DESC
  `, [organizationId]);
  return result.rows.map(row => ({
    id: row.id,
    name: row.name,
    orderCount: parseInt(row.order_count),
    revenue: parseFloat(row.revenue),
    avgOrderValue: parseFloat(row.avg_order_value),
    pendingOrders: parseInt(row.pending_orders)
  }));
}

async function getDashboardSummary(organizationId, outletId = null) {
  const today = new Date().toISOString().slice(0, 10);
  const params = [organizationId, today];
  let outletFilter = '';
  if (outletId) {
    outletFilter = ' AND outlet_id = $3';
    params.push(outletId);
  }

  // 1. Main metrics (no GROUP BY)
  const orderQuery = `
    SELECT 
      COUNT(*) as total_orders,
      COALESCE(SUM(grand_total), 0) as total_revenue,
      COUNT(CASE WHEN order_status IN ('NEW','PREPARING') THEN 1 END) as pending_orders,
      COUNT(CASE WHEN order_status = 'COMPLETED' THEN 1 END) as completed_orders,
      COALESCE(AVG(grand_total), 0) as avg_order_value
    FROM orders
    WHERE organization_id = $1 AND DATE(created_at) = $2
    ${outletFilter}
  `;
  const orderRes = await pool.query(orderQuery, params);

  // 2. Top 5 items
  const topItemsQuery = `
    SELECT oi.item_name, SUM(oi.quantity) as total_qty, SUM(oi.line_total) as revenue
    FROM order_items oi
    JOIN orders o ON oi.order_id = o.id
    WHERE o.organization_id = $1 AND DATE(o.created_at) = $2
    ${outletFilter}
    GROUP BY oi.item_name
    ORDER BY revenue DESC
    LIMIT 5
  `;
  const topItemsRes = await pool.query(topItemsQuery, params);

  // 3. Payment breakdown
  const paymentQuery = `
    SELECT payment_method, COALESCE(SUM(grand_total), 0) as total
    FROM orders
    WHERE organization_id = $1 AND DATE(created_at) = $2
    ${outletFilter}
    GROUP BY payment_method
  `;
  const paymentRes = await pool.query(paymentQuery, params);

  // 4. Order source breakdown – fix GROUP BY by using a subquery or repeating CASE
  const sourceQuery = `
    SELECT source, COUNT(*) as count
    FROM (
      SELECT 
        CASE 
          WHEN order_source = 'PUBLIC_QR' THEN 'QR'
          ELSE order_source
        END as source
      FROM orders
      WHERE organization_id = $1 AND DATE(created_at) = $2
      ${outletFilter}
    ) t
    GROUP BY source
  `;
  const sourceRes = await pool.query(sourceQuery, params);

  // 5. Payment status KPIs
  const paidQuery = `
    SELECT 
      COUNT(CASE WHEN payment_status = 'PAID' THEN 1 END) as paid_orders,
      COALESCE(SUM(CASE WHEN payment_status = 'PAID' THEN grand_total END), 0) as paid_amount,
      COUNT(CASE WHEN payment_status IN ('PENDING', 'PENDING_PROOF') THEN 1 END) as pending_orders,
      COALESCE(SUM(CASE WHEN payment_status IN ('PENDING', 'PENDING_PROOF') THEN grand_total END), 0) as pending_amount
    FROM orders
    WHERE organization_id = $1 AND DATE(created_at) = $2
    ${outletFilter}
  `;
  const paidRes = await pool.query(paidQuery, params);

  // 6. Order status counts (NEW, PREPARING, READY, COMPLETED)
  const statusQuery = `
    SELECT order_status, COUNT(*) as count
    FROM orders
    WHERE organization_id = $1 AND DATE(created_at) = $2
    ${outletFilter}
    GROUP BY order_status
  `;
  const statusRes = await pool.query(statusQuery, params);
  const orderStatusCounts = {};
  statusRes.rows.forEach(row => { orderStatusCounts[row.order_status] = parseInt(row.count); });

  return {
    totalOrders: parseInt(orderRes.rows[0].total_orders || 0),
    totalRevenue: parseFloat(orderRes.rows[0].total_revenue || 0),
    pendingOrders: parseInt(orderRes.rows[0].pending_orders || 0),
    completedOrders: parseInt(orderRes.rows[0].completed_orders || 0),
    avgOrderValue: parseFloat(orderRes.rows[0].avg_order_value || 0),
    topItems: topItemsRes.rows,
    paymentBreakdown: paymentRes.rows,
    orderSource: sourceRes.rows,
    paymentStatus: paidRes.rows[0],
    orderStatus: orderStatusCounts
  };
}

module.exports = {
  getSummaryReport,
  getDateRangeReport,
  getBrandAnalytics,
  getOutletAnalytics,
  getKitchenStats,
  getRevenueTrend,
  getOrderStatusDistribution,
  getOutletComparison,
  getDashboardSummary
};