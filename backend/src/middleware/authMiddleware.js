const admin = require('../config/firebase');

async function authMiddleware(request, reply) {
  try {
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      return reply.status(401).send({
        success: false,
        message: 'Unauthorized'
      });
    }

    const token = authHeader.split(' ')[1];

    const decoded = await admin.auth().verifyIdToken(token);

        // // ... inside your authMiddleware function
    console.log('--- Auth Middleware Debug ---');
    console.log('Authorization header:', request.headers.authorization);
    // ... after verifying the token
    console.log('Decoded token UID:', decoded.uid);
    console.log('--- End Auth Middleware ---');

    request.user = decoded;

  } catch (error) {
    console.error(error);
    return reply.status(401).send({
      success: false,
      message: 'Invalid token'
    });
  }
}

module.exports = authMiddleware;