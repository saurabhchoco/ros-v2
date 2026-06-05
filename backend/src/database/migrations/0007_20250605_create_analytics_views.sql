-- 1. Brand Summary (current period vs previous period)
CREATE OR REPLACE VIEW vw_brand_summary AS
WITH current_period AS (
  SELECT
    COALESCE(SUM(o.grand_total), 0) AS revenue,
    COUNT(DISTINCT o.id) AS orders,
    COALESCE(AVG(o.grand_total), 0) AS aov
  FROM orders o
  WHERE o.created_at >= date_trunc('week', CURRENT_DATE)   -- period = week (adjust as needed)
    AND o.created_at < date_trunc('week', CURRENT_DATE) + interval '1 week'
    AND o.order_status != 'CANCELLED'
),
previous_period AS (
  SELECT
    COALESCE(SUM(o.grand_total), 0) AS revenue,
    COUNT(DISTINCT o.id) AS orders,
    COALESCE(AVG(o.grand_total), 0) AS aov
  FROM orders o
  WHERE o.created_at >= date_trunc('week', CURRENT_DATE) - interval '1 week'
    AND o.created_at < date_trunc('week', CURRENT_DATE)
    AND o.order_status != 'CANCELLED'
)
SELECT
  c.revenue,
  c.orders,
  c.aov,
  CASE WHEN p.revenue > 0 THEN ((c.revenue - p.revenue) / p.revenue) * 100 ELSE 0 END AS revenue_growth_pct,
  CASE WHEN p.orders > 0 THEN ((c.orders - p.orders) / p.orders) * 100 ELSE 0 END AS orders_growth_pct,
  CASE WHEN p.aov > 0 THEN ((c.aov - p.aov) / p.aov) * 100 ELSE 0 END AS aov_growth_pct
FROM current_period c, previous_period p;

-- 2. Outlet Performance (including share of brand revenue)
CREATE OR REPLACE VIEW vw_outlet_performance AS
WITH brand_total AS (
  SELECT COALESCE(SUM(grand_total), 0) AS total_revenue
  FROM orders
  WHERE created_at >= date_trunc('week', CURRENT_DATE)
    AND order_status != 'CANCELLED'
)
SELECT
  o.id AS outlet_id,
  o.name AS outlet_name,
  COALESCE(SUM(ord.grand_total), 0) AS revenue,
  COUNT(DISTINCT ord.id) AS orders,
  COALESCE(AVG(ord.grand_total), 0) AS aov,
  CASE WHEN bt.total_revenue > 0 THEN (COALESCE(SUM(ord.grand_total), 0) / bt.total_revenue) * 100 ELSE 0 END AS share_of_brand_pct,
  -- Completion rate: (completed orders) / (total non-cancelled orders)
  ROUND(
    COUNT(DISTINCT CASE WHEN ord.order_status = 'COMPLETED' THEN ord.id END)::NUMERIC /
    NULLIF(COUNT(DISTINCT CASE WHEN ord.order_status != 'CANCELLED' THEN ord.id END), 0),
    2
  ) * 100 AS completion_rate_pct
FROM outlets o
LEFT JOIN orders ord ON ord.outlet_id = o.id
  AND ord.created_at >= date_trunc('week', CURRENT_DATE)
  AND ord.order_status != 'CANCELLED'
CROSS JOIN brand_total bt
GROUP BY o.id, o.name, bt.total_revenue;

-- 3. Product Performance (top products by revenue)
CREATE OR REPLACE VIEW vw_product_performance AS
SELECT
  mi.id AS product_id,
  mi.name AS product_name,
  SUM(oi.quantity) AS quantity_sold,
  SUM(oi.line_total) AS revenue
FROM order_items oi
JOIN menu_items mi ON mi.id = oi.menu_item_id
JOIN orders o ON o.id = oi.order_id
WHERE o.created_at >= date_trunc('week', CURRENT_DATE)
  AND o.order_status != 'CANCELLED'
GROUP BY mi.id, mi.name
ORDER BY revenue DESC
LIMIT 10;

-- 4. Category Performance
CREATE OR REPLACE VIEW vw_category_performance AS
SELECT
  mc.id AS category_id,
  mc.name AS category_name,
  SUM(oi.line_total) AS revenue
FROM order_items oi
JOIN menu_items mi ON mi.id = oi.menu_item_id
JOIN menu_categories mc ON mc.id = mi.category_id
JOIN orders o ON o.id = oi.order_id
WHERE o.created_at >= date_trunc('week', CURRENT_DATE)
  AND o.order_status != 'CANCELLED'
GROUP BY mc.id, mc.name
ORDER BY revenue DESC;

-- 5. Peak Hours (hourly order count)
CREATE OR REPLACE VIEW vw_peak_hours AS
SELECT
  EXTRACT(HOUR FROM o.created_at) AS hour,
  COUNT(*) AS order_count
FROM orders o
WHERE o.created_at >= date_trunc('week', CURRENT_DATE)
  AND o.order_status != 'CANCELLED'
GROUP BY hour
ORDER BY hour;