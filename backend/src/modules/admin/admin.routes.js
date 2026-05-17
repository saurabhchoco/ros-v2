const controller =
  require('./admin.controller');

async function routes(
  app
) {

  app.post(

    '/api/v1/admin/create-brand',

    controller.createBrand

  );

}

module.exports = routes;