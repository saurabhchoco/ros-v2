function errorHandler(error, request, reply) {

  // Already-handled replies (e.g. reply.status(400).send())
  if (reply.sent) return;

  // Zod validation errors
  if (error.name === 'ZodError') {
    return reply.status(400).send({
      success: false,
      message: 'Validation failed',
      errors: error.errors
    });
  }

  // Firebase auth errors
  if (error.code && error.code.startsWith('auth/')) {
    return reply.status(401).send({
      success: false,
      message: 'Authentication error',
      code: error.code
    });
  }

  // Explicit 404
  if (error.statusCode === 404) {
    return reply.status(404).send({
      success: false,
      message: error.message || 'Resource not found'
    });
  }

  // Explicit 403
  if (error.statusCode === 403) {
    return reply.status(403).send({
      success: false,
      message: error.message || 'Forbidden'
    });
  }

  // PostgreSQL errors
  if (error.code && error.code.match(/^[0-9A-Z]{5}$/)) {
    console.error('[DB ERROR]', {
      url: request.url,
      method: request.method,
      pgCode: error.code,
      message: error.message
    });
    return reply.status(500).send({
      success: false,
      message: 'Database error',
      code: error.code
    });
  }

  // Default 500 — log full context
  console.error('[SERVER ERROR]', {
    url: request.url,
    method: request.method,
    message: error.message,
    stack: error.stack
  });

  return reply.status(500).send({
    success: false,
    message: 'Internal server error'
  });

}

module.exports = errorHandler;