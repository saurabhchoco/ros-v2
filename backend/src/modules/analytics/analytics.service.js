console.log(require('./date.helper'));
const analyticsRepository = require('./analytics.repository');

const { getDateRange } = require('./date.helper');

const {
  fillMissingDates,
  fillMissingHours
} = require('./trend.helper');

const {
  calculateHealth
} = require('./health.helper');

class AnalyticsService {
  async getBrandAnalytics(
    organizationId,
    period = '7d'
  ) {
    const {
      startDate,
      endDate
    } = getDateRange(period);

    const [
      summaryRow,
      outletRows,
      trendRows,
      peakHourRows,
      productRows,
      paymentRows,
      sourceRows,
      outletStatusRows,
      categoryRows
    ] = await Promise.all([
      analyticsRepository.getSummary(
        organizationId,
        startDate,
        endDate
      ),

      analyticsRepository.getOutletComparison(
        organizationId,
        startDate,
        endDate
      ),

      analyticsRepository.getRevenueTrend(
        organizationId,
        startDate,
        endDate
      ),

      analyticsRepository.getPeakHours(
        organizationId,
        startDate,
        endDate
      ),

      analyticsRepository.getTopProducts(
        organizationId,
        startDate,
        endDate
      ),

      analyticsRepository.getPaymentMethods(
        organizationId,
        startDate,
        endDate
      ),

      analyticsRepository.getOrderSources(
        organizationId,
        startDate,
        endDate
      ),
      analyticsRepository.getOutletStatusCounts(organizationId, startDate, endDate),
      analyticsRepository.getCategoryPerformance(organizationId, startDate, endDate)
    ]);

    // Build status map per outlet
    const outletStatusMap = {};
    outletStatusRows.forEach(row => {
      const { outlet_id, order_status, count } = row;
      if (!outletStatusMap[outlet_id]) {
        outletStatusMap[outlet_id] = {};
      }
      outletStatusMap[outlet_id][order_status] = Number(count);
    });

    const revenue =
      Number(summaryRow.revenue || 0);

    const totalOrders =
      Number(summaryRow.total_orders || 0);

    const cancelledOrders =
      Number(summaryRow.cancelled_orders || 0);

    const activeOrders =
      Number(summaryRow.active_orders || 0);

    const aov =
      activeOrders > 0
        ? revenue / activeOrders
        : 0;

    const cancelRate =
      totalOrders > 0
        ? (cancelledOrders / totalOrders) * 100
        : 0;

    const outlets = outletRows.map(outlet => {
      const revenue =
        Number(outlet.revenue || 0);

      const orders =
        Number(outlet.orders || 0);

      const cancelled =
        Number(
          outlet.cancelled_orders || 0
        );

      const share =
        revenue > 0
          ? (revenue /
            Math.max(
              Number(summaryRow.revenue || 0),
              1
            )) *
          100
          : 0;

      const cancellationRate =
        orders > 0
          ? (cancelled / orders) * 100
          : 0;

      const health =
        calculateHealth(
          {
            revenue,
            orders,
            cancellation_rate:
              cancellationRate
          },
          Number(summaryRow.revenue || 0)
        );

      // ✅ Get status counts for this outlet from the map
      const statusCounts = outletStatusMap[outlet.id] || {};

      return {
        outletId: outlet.id,
        outletName: outlet.name,

        revenue,

        orders,

        cancelledOrders: cancelled,

        cancellationRate,

        share,

        aov:
          orders > 0
            ? revenue / orders
            : 0,

        healthScore:
          health.score,

        healthStatus:
          health.status,

        statusCounts   // ✅ now correctly defined
      };
    });

    const revenueTrend =
      fillMissingDates(
        startDate,
        endDate,
        trendRows
      );

    const peakHours =
      fillMissingHours(
        peakHourRows
      );

    return {
      period,

      summary: {
        revenue,

        orders: totalOrders,

        activeOrders,

        cancelledOrders,

        cancelRate,

        aov
      },

      outlets,

      revenueTrend,

      peakHours,

      topProducts:
        productRows.map(p => ({
          name: p.item_name,
          quantity: Number(
            p.quantity || 0
          ),
          revenue: Number(
            p.revenue || 0
          )
        })),

      paymentMethods:
        paymentRows.map(p => ({
          method: p.method,
          orders: Number(
            p.orders || 0
          ),
          revenue: Number(
            p.revenue || 0
          )
        })),

      orderSources:
        sourceRows.map(s => ({
          source: s.source,
          orders: Number(
            s.orders || 0
          ),
          revenue: Number(
            s.revenue || 0
          )
        })),

      categories: categoryRows.map(c => ({
        category_id: c.category_id,
        category_name: c.category_name,
        revenue: parseFloat(c.revenue),
        order_count: parseInt(c.order_count || 0)
      }))
    };
  }
}

module.exports =
  new AnalyticsService();