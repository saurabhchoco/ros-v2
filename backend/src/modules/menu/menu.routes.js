const menuController =
  require('./menu.controller');

const authMiddleware =
  require('../../middleware/authMiddleware');

async function menuRoutes(app) {

  app.post(
    '/api/v1/menu/categories/create',
    {
      preHandler: [
        authMiddleware
      ]
    },
    menuController.createCategory
  );

  app.get(
    '/api/v1/menu/categories/list',
    {
      preHandler: [
        authMiddleware
      ]
    },
    menuController.listCategories
  );

  app.post(
    '/api/v1/menu/items/create',
    {
      preHandler: [
        authMiddleware
      ]
    },
    menuController.createMenuItem
  );

  app.get(
    '/api/v1/menu/items/list',
    {
      preHandler: [
        authMiddleware
      ]
    },
    menuController.listMenuItems
  );

}

module.exports =
  menuRoutes;