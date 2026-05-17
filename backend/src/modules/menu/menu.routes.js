const menuController =
  require('./menu.controller');

const authMiddleware =
  require('../../middleware/authMiddleware');

const userContextMiddleware =
  require('../../middleware/userContextMiddleware');

const roleMiddleware =
  require('../../middleware/roleMiddleware');

async function menuRoutes(app) {

  app.post(
    '/api/v1/menu/categories/create',
    {
      preHandler: [
        authMiddleware,
        userContextMiddleware,
        roleMiddleware(['BRAND_OWNER', 'OUTLET_MANAGER'])
      ]
    },
    menuController.createCategory
  );

  app.get(
    '/api/v1/menu/categories/list',
    {
      preHandler: [
        authMiddleware,
        userContextMiddleware
      ]
    },
    menuController.listCategories
  );

  app.post(
    '/api/v1/menu/items/create',
    {
      preHandler: [
        authMiddleware,
        userContextMiddleware,
        roleMiddleware(['BRAND_OWNER', 'OUTLET_MANAGER'])
      ]
    },
    menuController.createMenuItem
  );

  app.get(
    '/api/v1/menu/items/list',
    {
      preHandler: [
        authMiddleware,
        userContextMiddleware
      ]
    },
    menuController.listMenuItems
  );

  app.post(
    '/api/v1/menu/import-csv',
    {
      preHandler: [
        authMiddleware,
        userContextMiddleware,
        roleMiddleware(['BRAND_OWNER', 'OUTLET_MANAGER'])
      ]
    },
    menuController.importCSV
  );

}

module.exports =
  menuRoutes;