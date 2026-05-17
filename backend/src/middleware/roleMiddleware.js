function roleMiddleware(allowedRoles = []) {

  return async function(request, reply) {

    const userRole = request.user?.role;

    if (!allowedRoles.includes(userRole)) {

      return reply.status(403).send({
        success: false,
        message: 'Forbidden'
      });
    }

  };

}

module.exports = roleMiddleware;