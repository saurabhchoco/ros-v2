const outletController = require('./outlet.controller');

async function outletRoutes(app) {

  app.post(
    '/api/v1/outlets/create',
    outletController.createOutlet
  );

  app.get(
    '/api/v1/outlets/list',
    outletController.listOutlets
  );

  app.post(
    '/api/v1/outlets/create-manager',
    outletController.createOutletManager
  );
}

module.exports = outletRoutes;