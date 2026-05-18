const reportController =
  require('./report.controller');

const authMiddleware =
  require('../../middleware/authMiddleware');

const userContextMiddleware =
  require('../../middleware/userContextMiddleware');

async function reportRoutes(app) {

  app.get(
    '/api/v1/reports/summary',
    {
      preHandler: [
        authMiddleware,
        userContextMiddleware
      ]
    },
    reportController.getSummary
  );

  app.get(
    '/api/v1/reports/by-date',
    {
      preHandler: [
        authMiddleware,
        userContextMiddleware
      ]
    },
    reportController.getByDateRange
  );

}

module.exports = reportRoutes;