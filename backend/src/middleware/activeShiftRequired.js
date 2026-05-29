const pool = require('../config/db');

async function activeShiftRequired(req, reply) {
  const role = req.user?.role || req.userContext?.role;
  // Roles that must have an active shift to perform operations
  const shiftRequiredRoles = ['CAPTAIN', 'GSA', 'CASHIER', 'KITCHEN'];
  
  // If the user's role does NOT require a shift, skip the check
  if (!shiftRequiredRoles.includes(role)) {
    return; // proceed to next middleware / handler
  }

  const userId = req.userContext?.id || req.user?.id;
  if (!userId) {
    return reply.code(401).send({ error: 'Unauthorized' });
  }

  const res = await pool.query(
    `SELECT id FROM shift_sessions WHERE user_id = $1 AND status = 'ACTIVE'`,
    [userId]
  );
  if (res.rows.length === 0) {
    return reply.code(403).send({ error: 'No active shift – please start your shift' });
  }
}

module.exports = activeShiftRequired;