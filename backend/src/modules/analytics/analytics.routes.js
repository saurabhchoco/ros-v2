const authMiddleware =
  require('../../middleware/authMiddleware');

const userContextMiddleware =
  require('../../middleware/userContextMiddleware');

const roleMiddleware =
  require('../../middleware/roleMiddleware');

const analyticsController =
  require('./analytics.controller');

async function analyticsRoutes(app) {

  app.get(
    '/api/v1/analytics-v3/brand',
    {
      preHandler: [
        authMiddleware,
        userContextMiddleware,
        roleMiddleware([
          'BRAND_OWNER'
        ])
      ]
    },
    analyticsController.getBrandAnalytics
  );

}

module.exports = analyticsRoutes;