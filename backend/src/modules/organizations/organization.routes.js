const authMiddleware = require('../../middleware/authMiddleware');
const roleMiddleware = require('../../middleware/roleMiddleware');
const organizationController = require('./organization.controller');
const userContextMiddleware = require('../../middleware/userContextMiddleware');

const superAdminOnly = [
  authMiddleware,
  userContextMiddleware,
  roleMiddleware(['SUPER_ADMIN'])
];

async function organizationRoutes(app) {

  app.post(
    '/api/v1/organizations/create',
    { preHandler: superAdminOnly },
    organizationController.createOrganization
  );

  app.get(
    '/api/v1/organizations/list',
    { preHandler: superAdminOnly },
    organizationController.listOrganizations
  );

}

module.exports = organizationRoutes;