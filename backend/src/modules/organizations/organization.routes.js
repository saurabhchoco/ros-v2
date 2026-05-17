const organizationController = require('./organization.controller');

async function organizationRoutes(app) {

  app.post(
    '/api/v1/organizations/create',
    organizationController.createOrganization
  );

  app.get(
    '/api/v1/organizations/list',
    organizationController.listOrganizations
  );

}

module.exports = organizationRoutes;