const authService = require('./auth.service');

async function login(request, reply) {
  try {
    const { email, password } = request.body;

    // Validation
    if (!email || !password) {
      return reply.status(400).send({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Attempt login
    const result = await authService.loginWithEmail(email, password);

    if (!result.success) {
      return reply.status(401).send({
        success: false,
        message: result.message || 'Invalid credentials'
      });
    }

    return reply.send({
      success: true,
      message: 'Login successful',
      data: {
        token: result.token,
        refreshToken: result.refreshToken,
        user: result.user
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return reply.status(500).send({
      success: false,
      message: 'Login failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'An error occurred'
    });
  }
}

async function firebaseLogin(request, reply) {
  try {
    const { idToken } = request.body;

    if (!idToken) {
      return reply.status(400).send({
        success: false,
        message: 'Firebase ID token is required'
      });
    }

    const result = await authService.loginWithFirebase(idToken);

    if (!result.success) {
      return reply.status(401).send({
        success: false,
        message: result.message || 'Firebase authentication failed'
      });
    }

    return reply.send({
      success: true,
      message: 'Firebase login successful',
      data: {
        token: result.token,
        refreshToken: result.refreshToken,
        user: result.user
      }
    });
  } catch (error) {
    console.error('Firebase login error:', error);
    return reply.status(401).send({
      success: false,
      message: 'Firebase authentication failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'An error occurred'
    });
  }
}

async function logout(request, reply) {
  try {
    // In a real app, you might invalidate the token here
    // For now, logout is handled on the client side
    return reply.send({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    return reply.status(500).send({
      success: false,
      message: 'Logout failed'
    });
  }
}

async function refreshToken(request, reply) {
  try {
    const { refreshToken } = request.body;

    if (!refreshToken) {
      return reply.status(400).send({
        success: false,
        message: 'Refresh token is required'
      });
    }

    const result = await authService.refreshToken(refreshToken);

    if (!result.success) {
      return reply.status(401).send({
        success: false,
        message: 'Token refresh failed'
      });
    }

    return reply.send({
      success: true,
      data: {
        token: result.token,
        refreshToken: result.refreshToken
      }
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    return reply.status(401).send({
      success: false,
      message: 'Token refresh failed'
    });
  }
}

async function verifyToken(request, reply) {
  try {
    // If we reach here, the token is valid (authMiddleware checks it)
    return reply.send({
      success: true,
      message: 'Token is valid',
      data: {
        user: request.user
      }
    });
  } catch (error) {
    return reply.status(401).send({
      success: false,
      message: 'Token verification failed'
    });
  }
}

module.exports = {
  login,
  firebaseLogin,
  logout,
  refreshToken,
  verifyToken
};
