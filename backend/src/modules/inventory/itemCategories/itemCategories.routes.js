const authMiddleware =
  require('../../../middleware/authMiddleware');

const userContextMiddleware =
  require('../../../middleware/userContextMiddleware');

const roleMiddleware =
  require('../../../middleware/roleMiddleware');

const itemCategoriesController =
  require('./itemCategories.controller');

async function itemCategoriesRoutes(app) {

  app.post(
    '/api/v1/inventory/item-categories',
    {
      preHandler: [
        authMiddleware,
        userContextMiddleware,
        roleMiddleware([
          'BRAND_OWNER'
        ])
      ]
    },
    itemCategoriesController.assignItemCategory
  );

  app.get(
    '/api/v1/inventory/item-categories',
    {
      preHandler: [
        authMiddleware,
        userContextMiddleware
      ]
    },
    itemCategoriesController.listItemCategories
  );

  app.delete(
    '/api/v1/inventory/item-categories/:id',
    {
      preHandler: [
        authMiddleware,
        userContextMiddleware,
        roleMiddleware([
          'BRAND_OWNER'
        ])
      ]
    },
    itemCategoriesController.removeItemCategory
  );
}

module.exports = itemCategoriesRoutes;