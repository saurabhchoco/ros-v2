const pool = require('../../config/db');

class AnalyticsRepository {
  async getSummary(
    organizationId,
    startDate,
    endDate
  ) {
    const query = `
      SELECT
        COUNT(*) AS total_orders,

        COUNT(
          CASE
            WHEN order_status = 'CANCELLED'
            THEN 1
          END
        ) AS cancelled_orders,

        COUNT(
          CASE
            WHEN order_status != 'CANCELLED'
            THEN 1
          END
        ) AS active_orders,

        COALESCE(
          SUM(
            CASE
              WHEN order_status != 'CANCELLED'
              THEN grand_total
              ELSE 0
            END
          ),
          0
        ) AS revenue

      FROM orders

      WHERE organization_id = $1
        AND created_at >= $2
        AND created_at < $3
    `;

    const result = await pool.query(
      query,
      [organizationId, startDate, endDate]
    );

    return result.rows[0];
  }

  async getOutletComparison(
    organizationId,
    startDate,
    endDate
  ) {
    const query = `
      SELECT
        o.id,
        o.name,

        COUNT(ord.id) AS orders,

        COUNT(
          CASE
            WHEN ord.order_status = 'CANCELLED'
            THEN 1
          END
        ) AS cancelled_orders,

        COALESCE(
          SUM(
            CASE
              WHEN ord.order_status != 'CANCELLED'
              THEN ord.grand_total
              ELSE 0
            END
          ),
          0
        ) AS revenue

      FROM outlets o

      LEFT JOIN orders ord
        ON ord.outlet_id = o.id
       AND ord.organization_id = o.organization_id
       AND ord.created_at >= $2
       AND ord.created_at < $3

      WHERE o.organization_id = $1

      GROUP BY
        o.id,
        o.name

      ORDER BY revenue DESC
    `;

    const result = await pool.query(
      query,
      [organizationId, startDate, endDate]
    );

    return result.rows;
  }

  async getRevenueTrend(
    organizationId,
    startDate,
    endDate
  ) {
    const query = `
      SELECT
        DATE(created_at) AS date,

        COALESCE(
          SUM(
            CASE
              WHEN order_status != 'CANCELLED'
              THEN grand_total
              ELSE 0
            END
          ),
          0
        ) AS revenue

      FROM orders

      WHERE organization_id = $1
        AND created_at >= $2
        AND created_at < $3

      GROUP BY DATE(created_at)

      ORDER BY DATE(created_at)
    `;

    const result = await pool.query(
      query,
      [organizationId, startDate, endDate]
    );

    return result.rows;
  }

  async getPeakHours(
    organizationId,
    startDate,
    endDate
  ) {
    const query = `
      SELECT
        EXTRACT(HOUR FROM created_at) AS hour,
        COUNT(*) AS orders

      FROM orders

      WHERE organization_id = $1
        AND order_status != 'CANCELLED'
        AND created_at >= $2
        AND created_at < $3

      GROUP BY hour

      ORDER BY hour
    `;

    const result = await pool.query(
      query,
      [organizationId, startDate, endDate]
    );

    return result.rows;
  }

  async getTopProducts(
    organizationId,
    startDate,
    endDate,
    limit = 10
  ) {
    const query = `
      SELECT
        oi.item_name,

        SUM(oi.quantity) AS quantity,

        SUM(oi.line_total) AS revenue

      FROM order_items oi

      JOIN orders o
        ON o.id = oi.order_id

      WHERE o.organization_id = $1
        AND o.order_status != 'CANCELLED'
        AND o.created_at >= $2
        AND o.created_at < $3

      GROUP BY oi.item_name

      ORDER BY revenue DESC

      LIMIT $4
    `;

    const result = await pool.query(
      query,
      [organizationId, startDate, endDate, limit]
    );

    return result.rows;
  }

  async getPaymentMethods(
    organizationId,
    startDate,
    endDate
  ) {
    const query = `
      SELECT
        UPPER(TRIM(payment_method)) AS method,

        COUNT(*) AS orders,

        COALESCE(
          SUM(
            CASE
              WHEN order_status != 'CANCELLED'
              THEN grand_total
              ELSE 0
            END
          ),
          0
        ) AS revenue

      FROM orders

      WHERE organization_id = $1
        AND created_at >= $2
        AND created_at < $3

      GROUP BY method

      ORDER BY revenue DESC
    `;

    const result = await pool.query(
      query,
      [organizationId, startDate, endDate]
    );

    return result.rows;
  }

  async getOrderSources(
    organizationId,
    startDate,
    endDate
  ) {
    const query = `
      SELECT
  source,
  COUNT(*) AS orders,
  SUM(revenue) AS revenue
FROM (
  SELECT
    CASE
      WHEN UPPER(TRIM(order_source)) = 'PUBLIC_QR'
      THEN 'QR'
      ELSE UPPER(TRIM(order_source))
    END AS source,

    CASE
      WHEN order_status != 'CANCELLED'
      THEN grand_total
      ELSE 0
    END AS revenue

  FROM orders

  WHERE organization_id = $1
    AND created_at >= $2
    AND created_at < $3
) t

GROUP BY source
ORDER BY orders DESC
    `;

    const result = await pool.query(
      query,
      [organizationId, startDate, endDate]
    );

    return result.rows;
  }

  async getOutletStatusCounts(organizationId, startDate, endDate) {
    const query = `
    SELECT
      outlet_id,
      order_status,
      COUNT(*) AS count
    FROM orders
    WHERE organization_id = $1
      AND created_at >= $2
      AND created_at < $3
    GROUP BY outlet_id, order_status
  `;
    const result = await pool.query(query, [organizationId, startDate, endDate]);
    return result.rows;
  }

  async getCategoryPerformance(organizationId, startDate, endDate) {
    const query = `
    WITH order_items_with_categories AS (
      SELECT
        oi.line_total,
        oi.order_id,
        COALESCE(mc.id::text, 'uncategorized') AS category_id,
        COALESCE(mc.name, 'Uncategorized') AS category_name
      FROM order_items oi
      INNER JOIN orders o
        ON o.id = oi.order_id
        AND o.organization_id = $1
        AND o.created_at >= $2
        AND o.created_at < $3
        AND o.payment_status = 'PAID'
        AND o.order_status NOT IN ('CANCELLED', 'FAILED', 'REFUNDED', 'VOIDED')
      LEFT JOIN menu_items mi
        ON mi.id = oi.menu_item_id
        AND mi.organization_id = $1
      LEFT JOIN menu_categories mc
        ON mc.id = mi.category_id
        AND mc.organization_id = $1
    )
    SELECT
      category_id,
      category_name,
      COALESCE(SUM(line_total), 0) AS revenue,
      COUNT(DISTINCT order_id) AS order_count
    FROM order_items_with_categories
    GROUP BY category_id, category_name
    ORDER BY revenue DESC;
  `;

    const result = await pool.query(query, [organizationId, startDate, endDate]);
    return result.rows;
  }
}

module.exports = new AnalyticsRepository();