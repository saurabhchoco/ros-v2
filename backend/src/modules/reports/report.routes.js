const reportController = require('./report.controller');
const authMiddleware = require('../../middleware/authMiddleware');
const userContextMiddleware = require('../../middleware/userContextMiddleware');
const roleMiddleware = require('../../middleware/roleMiddleware');

async function reportRoutes(app) {
  // Existing operational reports
  app.get(
    '/api/v1/reports/summary',
    { preHandler: [authMiddleware, userContextMiddleware] },
    reportController.getSummary
  );

  app.get(
    '/api/v1/reports/by-date',
    { preHandler: [authMiddleware, userContextMiddleware] },
    reportController.getByDateRange
  );

  // Brand Owner analytics
  app.get(
    '/api/v1/brand/analytics',
    {
      preHandler: [
        authMiddleware,
        userContextMiddleware,
        roleMiddleware(['BRAND_OWNER'])
      ]
    },
    reportController.getBrandAnalytics
  );

  app.get(
    '/api/v1/outlet/analytics',
    {
      preHandler: [
        authMiddleware,
        userContextMiddleware,
        roleMiddleware(['BRAND_OWNER'])
      ]
    },
    reportController.getOutletAnalytics
  );

  app.get(
  '/api/v1/kitchen/stats',
  {
    preHandler: [
      authMiddleware,
      userContextMiddleware,
      roleMiddleware(['OUTLET_MANAGER', 'KITCHEN'])
    ]
  },
    reportController.getKitchenStats
  );

  app.get('/api/v1/brand/revenue-trend', {
    preHandler: [authMiddleware, userContextMiddleware, roleMiddleware(['BRAND_OWNER'])]
  }, reportController.getRevenueTrend);

  app.get('/api/v1/brand/order-status', {
    preHandler: [authMiddleware, userContextMiddleware, roleMiddleware(['BRAND_OWNER'])]
  }, reportController.getOrderStatusDistribution);

  app.get('/api/v1/brand/outlet-comparison', {
    preHandler: [authMiddleware, userContextMiddleware, roleMiddleware(['BRAND_OWNER'])]
  }, reportController.getOutletComparison);

  app.get('/api/v1/dashboard/summary', {
    preHandler: [authMiddleware, userContextMiddleware, roleMiddleware(['OUTLET_MANAGER', 'BRAND_OWNER'])]
  }, reportController.getDashboardSummary);

}

module.exports = reportRoutes;