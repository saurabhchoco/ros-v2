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

  app.put(
    '/api/v1/menu/items/:id',
    {
      preHandler: [
        authMiddleware,
        userContextMiddleware,
        roleMiddleware(['BRAND_OWNER', 'OUTLET_MANAGER'])
      ]
    },
    menuController.updateMenuItem
  );

  app.delete(
    '/api/v1/menu/items/:id',
    {
      preHandler: [
        authMiddleware,
        userContextMiddleware,
        roleMiddleware(['BRAND_OWNER', 'OUTLET_MANAGER'])
      ]
    },
    menuController.deleteMenuItem
  );

  app.post(
    '/api/v1/menu/combos',
    {
      preHandler: [
        authMiddleware,
        userContextMiddleware,
        roleMiddleware(['BRAND_OWNER', 'OUTLET_MANAGER'])
      ]
    },
    menuController.createCombo
  );

  // Public menu endpoints (no auth)
  app.get('/api/v1/public/categories', menuController.listPublicCategories);
  app.get('/api/v1/public/items', menuController.listPublicMenuItems);

}

module.exports =
  menuRoutes;