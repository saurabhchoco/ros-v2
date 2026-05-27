const { ROLES } = require('../constants/roles');

function roleMiddleware(allowedRoles = []) {

  return async function(request, reply) {

    const userContext = request.userContext;

    if (!userContext) {
      return reply.status(401).send({
        success: false,
        message: 'Unauthorized'
      });
    }

    const userRole = userContext.role;

console.log('🔍 roleMiddleware - userRole:', userRole, '| allowedRoles:', allowedRoles);
    // SUPER_ADMIN bypasses all role checks
    if (userRole === ROLES.SUPER_ADMIN) {
      return;
    }

    if (!allowedRoles.includes(userRole)) {
      return reply.status(403).send({
        success: false,
        message: `Forbidden. Required role: ${allowedRoles.join(' or ')}`
      });
    }

  };

}

module.exports = roleMiddleware;