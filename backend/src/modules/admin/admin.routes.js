const controller =
  require('./admin.controller');

const authMiddleware =
  require('../../middleware/authMiddleware');

const userContextMiddleware =
  require('../../middleware/userContextMiddleware');

const roleMiddleware =
  require('../../middleware/roleMiddleware');

const superAdminOnly = [
  authMiddleware,
  userContextMiddleware,
  roleMiddleware(['SUPER_ADMIN'])
];

async function adminRoutes(app) {

  // Brands
  app.post(
    '/api/v1/admin/brands',
    { preHandler: superAdminOnly },
    controller.createBrand
  );

  app.get(
    '/api/v1/admin/brands',
    { preHandler: superAdminOnly },
    controller.listBrands
  );

  // Outlets
  app.post(
    '/api/v1/admin/outlets',
    { preHandler: superAdminOnly },
    controller.createOutlet
  );

  app.get(
    '/api/v1/admin/outlets',
    { preHandler: superAdminOnly },
    controller.listOutlets
  );

  // Outlet Managers
  app.post(
    '/api/v1/admin/managers',
    { preHandler: superAdminOnly },
    controller.createOutletManager
  );

  // Users
  app.get(
    '/api/v1/admin/users',
    { preHandler: superAdminOnly },
    controller.listUsers
  );

}

module.exports = adminRoutes;