const outletController =
  require('./outlet.controller');

const authMiddleware =
  require('../../middleware/authMiddleware');

const userContextMiddleware =
  require('../../middleware/userContextMiddleware');

const roleMiddleware =
  require('../../middleware/roleMiddleware');

async function outletRoutes(app) {

  app.post(
    '/api/v1/outlets/create',
    {
      preHandler: [
        authMiddleware,
        userContextMiddleware,
        roleMiddleware(['BRAND_OWNER'])
      ]
    },
    outletController.createOutlet
  );

  app.get(
    '/api/v1/outlets/list',
    {
      preHandler: [
        authMiddleware,
        userContextMiddleware
      ]
    },
    outletController.listOutlets
  );

  app.post(
    '/api/v1/outlets/create-manager',
    {
      preHandler: [
        authMiddleware,
        userContextMiddleware,
        roleMiddleware(['BRAND_OWNER'])
      ]
    },
    outletController.createOutletManager
  );

}

module.exports = outletRoutes;