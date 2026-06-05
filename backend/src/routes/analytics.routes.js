const authMiddleware = require('../middleware/authMiddleware');
const userContextMiddleware = require('../middleware/userContextMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const analyticsService = require('../services/analytics/analytics.service');
const healthScoreService = require('../services/analytics/health-score.service');
const insightsService = require('../services/analytics/insights.service');

async function analyticsRoutes(app) {
  app.get(
    '/api/v1/analytics/brand',
    {
      preHandler: [
        authMiddleware,
        userContextMiddleware,
        roleMiddleware(['BRAND_OWNER', 'SUPER_ADMIN']),
      ],
      schema: {
        querystring: {
          type: 'object',
          properties: {
            period: { type: 'string', enum: ['day', 'week', 'month'], default: 'week' },
          },
        },
      },
    },
    async (req, reply) => {
      const period = req.query.period || 'week';
      const organizationId = req.userContext?.organization_id || req.user?.organizationId;
      if (!organizationId) {
        return reply.code(400).send({ error: 'Organization ID missing' });
      }
      try {
        const summary = await analyticsService.getBrandSummary(organizationId, period);
        const outlets = await analyticsService.getOutletPerformance(organizationId, period);
        const products = await analyticsService.getProductPerformance(organizationId, period);
        const categories = await analyticsService.getCategoryPerformance(organizationId, period);
        const peakHours = await analyticsService.getPeakHours(organizationId, period);
        const revenueTrend = await analyticsService.getDailyRevenue(organizationId, period);
        const health = healthScoreService.calculate(summary, outlets);
        const insights = insightsService.generate(summary, outlets, products);

        return reply.send({
          success: true,
          data: {
            summary,
            health,
            outlets,
            products,
            categories,
            peakHours,
            insights,
            revenueTrend,
          },
        });
      } catch (err) {
        req.log.error(err);
        return reply.code(500).send({ error: 'Failed to fetch analytics data' });
      }
    }
  );
}

module.exports = analyticsRoutes;