const authMiddleware =
  require('../../../middleware/authMiddleware');

const userContextMiddleware =
  require('../../../middleware/userContextMiddleware');

const roleMiddleware =
  require('../../../middleware/roleMiddleware');

const masterItemsController =
  require('./masterItems.controller');

async function masterItemsRoutes(app) {

  app.post(
    '/api/v1/inventory/master-items',
    {
      preHandler: [
        authMiddleware,
        userContextMiddleware,
        roleMiddleware([
          'BRAND_OWNER'
        ])
      ]
    },
    masterItemsController.createMasterItem
  );

  app.get(
    '/api/v1/inventory/master-items',
    {
      preHandler: [
        authMiddleware,
        userContextMiddleware
      ]
    },
    masterItemsController.listMasterItems
  );

  app.put(
    '/api/v1/inventory/master-items/:id',
    {
      preHandler: [
        authMiddleware,
        userContextMiddleware,
        roleMiddleware([
          'BRAND_OWNER'
        ])
      ]
    },
    masterItemsController.updateMasterItem
  );

  app.delete(
    '/api/v1/inventory/master-items/:id',
    {
      preHandler: [
        authMiddleware,
        userContextMiddleware,
        roleMiddleware([
          'BRAND_OWNER'
        ])
      ]
    },
    masterItemsController.deactivateMasterItem
  );
}

module.exports = masterItemsRoutes;