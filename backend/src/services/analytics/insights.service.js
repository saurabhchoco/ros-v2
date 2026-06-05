// backend/src/services/analytics/insights.service.js
function toNumber(val) {
  const num = parseFloat(val);
  return isNaN(num) ? 0 : num;
}

class InsightsService {
  generate(summary, outletPerformance, productPerformance) {
    const insights = [];

    // Revenue growth insight (critical)
    const growth = toNumber(summary.revenue_growth_pct);
    const prevRevenue = toNumber(summary.prev_revenue || 0);
    if (growth < -20 && prevRevenue > 0) {
      insights.push({
        type: 'alert',
        severity: 'critical',
        title: `Revenue dropped ${Math.abs(growth).toFixed(1)}%`,
        description: 'Fewer orders than last week. Check if any operational issues occurred.',
      });
    } else if (growth > 20 && prevRevenue > 0) {
      insights.push({
        type: 'trend',
        severity: 'success',
        title: `Revenue increased ${growth.toFixed(1)}%`,
        description: 'Strong growth compared to previous period.',
      });
    }

    // Outlet dominance (opportunity)
    if (outletPerformance.length > 0) {
      const topOutlet = outletPerformance[0];
      const share = toNumber(topOutlet.share_of_brand_pct);
      if (share > 80) {
        insights.push({
          type: 'opportunity',
          severity: 'warning',
          title: `${topOutlet.outlet_name} generates most of your revenue`,
          description: 'Consider running promotions in other outlets to balance performance.',
        });
      }
    }

    // Top product insight (info)
    if (productPerformance.length > 0) {
      const topProduct = productPerformance[0];
      insights.push({
        type: 'trend',
        severity: 'info',
        title: `Top seller: ${topProduct.product_name}`,
        description: `${topProduct.quantity_sold} units sold, contributing ₹${topProduct.revenue}.`,
      });
    }

    // Order volume alert (warning)
    const ordersGrowth = toNumber(summary.orders_growth_pct);
    if (ordersGrowth > 30 && summary.prev_orders > 0) {
      insights.push({
        type: 'alert',
        severity: 'warning',
        title: `Orders increased ${ordersGrowth.toFixed(1)}%`,
        description: 'Kitchen load may increase. Consider adjusting staffing levels.',
      });
    }

    return insights;
  }
}

module.exports = new InsightsService();