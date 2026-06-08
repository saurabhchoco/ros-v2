const authMiddleware = require('../../../middleware/authMiddleware');
const userContextMiddleware = require('../../../middleware/userContextMiddleware');
const roleMiddleware = require('../../../middleware/roleMiddleware');

const unitsController = require('./units.controller');

async function unitsRoutes(app) {

  app.post(
    '/api/v1/inventory/units',
    {
      preHandler: [
        authMiddleware,
        userContextMiddleware,
        roleMiddleware([
          'BRAND_OWNER'
        ])
      ]
    },
    unitsController.createUnit
  );

  app.get(
    '/api/v1/inventory/units',
    {
      preHandler: [
        authMiddleware,
        userContextMiddleware
      ]
    },
    unitsController.listUnits
  );

  app.put(
    '/api/v1/inventory/units/:id',
    {
      preHandler: [
        authMiddleware,
        userContextMiddleware,
        roleMiddleware([
          'BRAND_OWNER'
        ])
      ]
    },
    unitsController.updateUnit
  );

  app.delete(
    '/api/v1/inventory/units/:id',
    {
      preHandler: [
        authMiddleware,
        userContextMiddleware,
        roleMiddleware([
          'BRAND_OWNER'
        ])
      ]
    },
    unitsController.deactivateUnit
  );
}

module.exports = unitsRoutes;