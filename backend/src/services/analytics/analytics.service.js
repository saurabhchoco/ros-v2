const pool = require('../../config/db');

class AnalyticsService {
  async getBrandSummary(organizationId, period = 'week') {
    const dateFilter = this.getDateFilter(period);
    const query = `
      SELECT
        COALESCE(SUM(o.grand_total), 0) AS revenue,
        COUNT(DISTINCT o.id) AS orders,
        COALESCE(AVG(o.grand_total), 0) AS aov
      FROM orders o
      WHERE o.created_at >= $1
        AND o.created_at < $2
        AND o.order_status != 'CANCELLED'
        AND o.organization_id = $3
    `;
    const current = await pool.query(query, [dateFilter.start, dateFilter.end, organizationId]);
    const previous = await pool.query(query, [dateFilter.prevStart, dateFilter.prevEnd, organizationId]);

    const revenue = parseFloat(current.rows[0].revenue);
    const orders = parseInt(current.rows[0].orders);
    const aov = parseFloat(current.rows[0].aov);
    const prevRevenue = parseFloat(previous.rows[0].revenue);
    const prevOrders = parseInt(previous.rows[0].orders);
    const prevAov = parseFloat(previous.rows[0].aov);

    return {
      revenue,
      orders,
      aov,
      prev_revenue: prevRevenue,
      prev_orders: prevOrders,
      revenue_growth_pct: prevRevenue ? ((revenue - prevRevenue) / prevRevenue) * 100 : 0,
      orders_growth_pct: prevOrders ? ((orders - prevOrders) / prevOrders) * 100 : 0,
      aov_growth_pct: prevAov ? ((aov - prevAov) / prevAov) * 100 : 0,
    };
  }

  async getOutletPerformance(organizationId, period = 'week') {
    const { start, end } = this.getDateFilter(period);
    const query = `
      SELECT
        o.id AS outlet_id,
        o.name AS outlet_name,
        COALESCE(SUM(ord.grand_total), 0) AS revenue,
        COUNT(DISTINCT ord.id) AS orders,
        COALESCE(AVG(ord.grand_total), 0) AS aov,
        ROUND(COALESCE(SUM(ord.grand_total) / SUM(SUM(ord.grand_total)) OVER (), 0) * 100, 1) AS share_of_brand_pct,
        ROUND(
          COUNT(DISTINCT CASE WHEN ord.order_status = 'COMPLETED' THEN ord.id END)::NUMERIC /
          NULLIF(COUNT(DISTINCT CASE WHEN ord.order_status != 'CANCELLED' THEN ord.id END), 0),
          2
        ) * 100 AS completion_rate_pct
      FROM outlets o
      LEFT JOIN orders ord ON ord.outlet_id = o.id
        AND ord.created_at >= $1
        AND ord.created_at < $2
        AND ord.order_status != 'CANCELLED'
        AND ord.organization_id = $3
      GROUP BY o.id, o.name
      ORDER BY revenue DESC
    `;
    const result = await pool.query(query, [start, end, organizationId]);
    return result.rows;
  }

  async getProductPerformance(organizationId, period = 'week') {
    const { start, end } = this.getDateFilter(period);
    const query = `
      SELECT
        mi.id AS product_id,
        mi.name AS product_name,
        SUM(oi.quantity) AS quantity_sold,
        SUM(oi.line_total) AS revenue
      FROM order_items oi
      JOIN menu_items mi ON mi.id = oi.menu_item_id
      JOIN orders o ON o.id = oi.order_id
      WHERE o.created_at >= $1
        AND o.created_at < $2
        AND o.order_status != 'CANCELLED'
        AND o.organization_id = $3
      GROUP BY mi.id, mi.name
      ORDER BY revenue DESC
      LIMIT 10
    `;
    const result = await pool.query(query, [start, end, organizationId]);
    return result.rows;
  }

  async getCategoryPerformance(organizationId, period = 'week') {
    const { start, end } = this.getDateFilter(period);
    const query = `
      SELECT
        mc.id AS category_id,
        mc.name AS category_name,
        COALESCE(SUM(oi.line_total), 0) AS revenue
      FROM menu_categories mc
      LEFT JOIN menu_items mi ON mi.category_id = mc.id
      LEFT JOIN order_items oi ON oi.menu_item_id = mi.id
      LEFT JOIN orders o ON o.id = oi.order_id
        AND o.created_at >= $1
        AND o.created_at < $2
        AND o.order_status != 'CANCELLED'
        AND o.organization_id = $3
      WHERE mc.organization_id = $3
      GROUP BY mc.id, mc.name
      ORDER BY revenue DESC
    `;
    const result = await pool.query(query, [start, end, organizationId]);
    return result.rows;
  }

  async getPeakHours(organizationId, period = 'week') {
    const { start, end } = this.getDateFilter(period);
    const query = `
      SELECT
        EXTRACT(HOUR FROM o.created_at) AS hour,
        COUNT(*) AS order_count
      FROM orders o
      WHERE o.created_at >= $1
        AND o.created_at < $2
        AND o.order_status != 'CANCELLED'
        AND o.organization_id = $3
      GROUP BY hour
      ORDER BY hour
    `;
    const result = await pool.query(query, [start, end, organizationId]);
    return result.rows;
  }

  async getDailyRevenue(organizationId, period = 'week') {
    const { start, end } = this.getDateFilter(period);
    const query = `
      SELECT
        DATE(created_at) AS date,
        COALESCE(SUM(grand_total), 0) AS revenue
      FROM orders
      WHERE created_at >= $1
        AND created_at < $2
        AND order_status != 'CANCELLED'
        AND organization_id = $3
      GROUP BY date
      ORDER BY date
    `;
    const result = await pool.query(query, [start, end, organizationId]);
    return result.rows;
  }

  getDateFilter(period) {
    const now = new Date();
    let start, end, prevStart, prevEnd;
    switch (period) {
      case 'day':
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        end = new Date(start.getTime() + 86400000);
        prevStart = new Date(start.getTime() - 86400000);
        prevEnd = start;
        break;
      case 'week':
        const dayOfWeek = now.getDay();
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek);
        start.setHours(0,0,0,0);
        end = new Date(start.getTime() + 7 * 86400000);
        prevStart = new Date(start.getTime() - 7 * 86400000);
        prevEnd = start;
        break;
      case 'month':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        prevEnd = start;
        break;
      default:
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
        end = now;
        prevStart = new Date(start.getTime() - 7 * 86400000);
        prevEnd = start;
    }
    return { start, end, prevStart, prevEnd };
  }
}

module.exports = new AnalyticsService();