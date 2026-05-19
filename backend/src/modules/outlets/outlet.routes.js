const outletController = require('./outlet.controller');
const authMiddleware = require('../../middleware/authMiddleware');
const userContextMiddleware = require('../../middleware/userContextMiddleware');
const roleMiddleware = require('../../middleware/roleMiddleware');

const brandOwnerOnly = [
  authMiddleware,
  userContextMiddleware,
  roleMiddleware(['BRAND_OWNER'])
];

async function outletRoutes(app) {

  app.post(
    '/api/v1/outlets/create',
    {
      preHandler: [
        authMiddleware,
        userContextMiddleware,
        roleMiddleware(['BRAND_OWNER'])
      ]
    },
    outletController.createOutlet
  );

  app.get(
    '/api/v1/outlets/list',
    {
      preHandler: [
        authMiddleware,
        userContextMiddleware
      ]
    },
    outletController.listOutlets
  );

  app.post(
    '/api/v1/outlets/create-manager',
    {
      preHandler: [
        authMiddleware,
        userContextMiddleware,
        roleMiddleware(['BRAND_OWNER'])
      ]
    },
    outletController.createOutletManager
  );

  // Brand Owner — list their own outlets
  app.get(
    '/api/v1/outlets/my',
    { preHandler: brandOwnerOnly },
    async (request, reply) => {
      const orgId = request.userContext.organization_id || request.userContext.organizationId;
      const outlets = await outletController.listOutletsByOrg(orgId);
      return reply.send({
        success: true,
        data: outlets
      });
    }
  );

  // Brand Owner — create outlet
  app.post(
    '/api/v1/outlets',
    { preHandler: brandOwnerOnly },
    outletController.createOutlet
  );

  app.get(
    '/api/v1/outlets/managers',
    { preHandler: brandOwnerOnly },
    outletController.listManagers
  );

}

module.exports = outletRoutes;