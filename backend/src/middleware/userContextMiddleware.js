const pool = require('../config/db');

async function userContextMiddleware(request, reply) {
  try {
    const firebaseUid = request.user.uid;

    const result = await pool.query(
      `SELECT * FROM users WHERE firebase_uid = $1 LIMIT 1`,
      [firebaseUid]
    );

    const user = result.rows[0];
    if (!user) {
      return reply.status(401).send({
        success: false,
        message: 'Operational user not found'
      });
    }

    // ✅ Update last_active_at (non‑blocking, fire-and-forget)
    pool.query(`UPDATE users SET last_active_at = NOW() WHERE id = $1`, [user.id]).catch(err =>
      console.error('Failed to update last_active_at for user', user.id, err)
    );

    // SUPER_ADMIN bypass – no org/outlet required
    if (user.role === 'SUPER_ADMIN') {
      request.userContext = user;
      return;
    }

    // For other roles, ensure org_id exists
    if (!user.organization_id) {
      return reply.status(401).send({ success: false, message: 'User missing organization' });
    }

    request.userContext = user;
  } catch (error) {
    console.error('userContextMiddleware error:', error);
    return reply.status(500).send({
      success: false,
      message: 'User context failed'
    });
  }
}

module.exports = userContextMiddleware;