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

  // GET /me - Get current user info
  app.get(
    '/api/v1/me',
    {
      preHandler: [
        authMiddleware
      ]
    },
    userController.getMe
  );

  // POST /me - Alternative way to get current user info
  // Some clients prefer POST for authenticated requests
  app.post(
    '/api/v1/me',
    {
      preHandler: [
        authMiddleware
      ]
    },
    userController.getMe
  );

  // PATCH /me - Update current user info
  app.patch(
    '/api/v1/me',
    {
      preHandler: [
        authMiddleware
      ]
    },
    userController.updateMe
  );

}

module.exports = userRoutes;
