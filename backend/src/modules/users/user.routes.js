const userController = require('./user.controller');
const authMiddleware = require('../../middleware/authMiddleware');
const roleMiddleware = require('../../middleware/roleMiddleware');
const userContextMiddleware = require('../../middleware/userContextMiddleware');

const superAdminOnly = [
  authMiddleware,
  userContextMiddleware,
  roleMiddleware(['SUPER_ADMIN'])
];

async function userRoutes(app) {

  app.post(
    '/api/v1/users/create',
    { preHandler: superAdminOnly },
    userController.createUser
  );

  app.get(
    '/api/v1/users/list',
    { preHandler: superAdminOnly },
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