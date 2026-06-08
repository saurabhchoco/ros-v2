const authMiddleware =
  require('../../../middleware/authMiddleware');

const userContextMiddleware =
  require('../../../middleware/userContextMiddleware');

const roleMiddleware =
  require('../../../middleware/roleMiddleware');

const vendorsController =
  require('./vendors.controller');

async function vendorsRoutes(app) {

  app.post(
    '/api/v1/inventory/vendors',
    {
      preHandler: [
        authMiddleware,
        userContextMiddleware,
        roleMiddleware(['BRAND_OWNER'])
      ]
    },
    vendorsController.createVendor
  );

  app.get(
    '/api/v1/inventory/vendors',
    {
      preHandler: [
        authMiddleware,
        userContextMiddleware
      ]
    },
    vendorsController.listVendors
  );

  app.put(
    '/api/v1/inventory/vendors/:id',
    {
      preHandler: [
        authMiddleware,
        userContextMiddleware,
        roleMiddleware(['BRAND_OWNER'])
      ]
    },
    vendorsController.updateVendor
  );

  app.delete(
    '/api/v1/inventory/vendors/:id',
    {
      preHandler: [
        authMiddleware,
        userContextMiddleware,
        roleMiddleware(['BRAND_OWNER'])
      ]
    },
    vendorsController.deactivateVendor
  );
}

module.exports = vendorsRoutes;