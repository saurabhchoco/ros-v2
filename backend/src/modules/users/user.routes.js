const userController = require('./user.controller');

async function userRoutes(app) {

  app.post(
    '/api/v1/users/create',
    userController.createUser
  );

  app.get(
    '/api/v1/users/list',
    userController.listUsers
  );

}

module.exports = userRoutes;