const pool = require('../config/db');

async function activeShiftRequired(req, reply) {
  const userId = req.userContext?.id || req.user?.id;
  if (!userId) return reply.code(401).send({ error: 'Unauthorized' });
  const res = await pool.query(
    `SELECT id FROM shift_sessions WHERE user_id = $1 AND status = 'ACTIVE'`,
    [userId]
  );
  if (res.rows.length === 0) {
    return reply.code(403).send({ error: 'No active shift – please start your shift' });
  }
}

module.exports = activeShiftRequired;