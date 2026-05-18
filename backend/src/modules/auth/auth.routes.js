const authController = require('./auth.controller');
const authMiddleware = require('../../middleware/authMiddleware');

async function authRoutes(app) {
  // Login with email and password
  app.post(
    '/api/v1/auth/login',
    authController.login
  );

  // Login with Firebase token
  app.post(
    '/api/v1/auth/firebase-login',
    authController.firebaseLogin
  );

  // Logout endpoint
  app.post(
    '/api/v1/auth/logout',
    {
      preHandler: [authMiddleware]
    },
    authController.logout
  );

  // Refresh token
  app.post(
    '/api/v1/auth/refresh',
    authController.refreshToken
  );

  // Verify token
  app.post(
    '/api/v1/auth/verify',
    {
      preHandler: [authMiddleware]
    },
    authController.verifyToken
  );
}

module.exports = authRoutes;
