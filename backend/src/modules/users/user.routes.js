const userController = require('./user.controller');
const authMiddleware =
  require('../../middleware/authMiddleware');

async function userRoutes(app) {

  app.post(
    '/api/v1/users/create',
    userController.createUser
  );

  app.get(
    '/api/v1/users/list',
    userController.listUsers
  );

  app.get(
    '/api/v1/me',
  {
    preHandler: [
      authMiddleware
    ]
  },
  userController.getMe
);

}

module.exports = userRoutes;