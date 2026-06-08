const authMiddleware =
  require('../../../middleware/authMiddleware');

const userContextMiddleware =
  require('../../../middleware/userContextMiddleware');

const roleMiddleware =
  require('../../../middleware/roleMiddleware');

const categoriesController =
  require('./categories.controller');

async function categoriesRoutes(app) {

  app.post(
    '/api/v1/inventory/categories',
    {
      preHandler: [
        authMiddleware,
        userContextMiddleware,
        roleMiddleware([
          'BRAND_OWNER'
        ])
      ]
    },
    categoriesController.createCategory
  );

  app.get(
    '/api/v1/inventory/categories',
    {
      preHandler: [
        authMiddleware,
        userContextMiddleware
      ]
    },
    categoriesController.listCategories
  );

  app.put(
    '/api/v1/inventory/categories/:id',
    {
      preHandler: [
        authMiddleware,
        userContextMiddleware,
        roleMiddleware([
          'BRAND_OWNER'
        ])
      ]
    },
    categoriesController.updateCategory
  );

  app.delete(
    '/api/v1/inventory/categories/:id',
    {
      preHandler: [
        authMiddleware,
        userContextMiddleware,
        roleMiddleware([
          'BRAND_OWNER'
        ])
      ]
    },
    categoriesController.deactivateCategory
  );
}

module.exports = categoriesRoutes;