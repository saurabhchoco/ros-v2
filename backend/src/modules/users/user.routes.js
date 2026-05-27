const userController = require('./user.controller');
const authMiddleware = require('../../middleware/authMiddleware');
const roleMiddleware = require('../../middleware/roleMiddleware');
const userContextMiddleware = require('../../middleware/userContextMiddleware');
const pool = require('../../config/db');

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
    { preHandler: [authMiddleware] },
    userController.getMe
  );

  // ✅ NEW: Get all users for an outlet (Brand Owner only)
  app.get('/api/v1/users/outlet/:outletId', {
    preHandler: [
      authMiddleware,
      userContextMiddleware,
      roleMiddleware(['BRAND_OWNER'])
    ]
  }, async (req, reply) => {
    const { outletId } = req.params;
    try {
      const result = await pool.query(
        `SELECT id, full_name, email, role, status, created_at
         FROM users
         WHERE outlet_id = $1
         ORDER BY created_at DESC`,
        [outletId]
      );
      return reply.send({ success: true, data: result.rows });
    } catch (err) {
      req.log.error(err);
      return reply.code(500).send({ error: 'Failed to fetch outlet users' });
    }
  });

  // GET /api/v1/users/outlet/:outletId/staff
  app.get('/api/v1/users/outlet/:outletId/staff', {
    preHandler: [
      authMiddleware,
      userContextMiddleware,
      roleMiddleware(['BRAND_OWNER'])
    ]
  }, async (req, reply) => {
    const { outletId } = req.params;
    try {
      const query = `
        SELECT 
          u.id,
          u.full_name,
          u.email,
          u.role,
          u.status,
          u.last_active_at,
          ss.status as shift_status,
          ss.started_at as shift_started_at,
          COALESCE(SUM(CASE WHEN o.order_status NOT IN ('CANCELLED','COMPLETED') THEN 1 ELSE 0 END), 0) as open_orders,
          COALESCE(COUNT(CASE WHEN DATE(o.created_at) = CURRENT_DATE THEN 1 END), 0) as orders_today,
          COALESCE(AVG(CASE WHEN o.order_status = 'COMPLETED' 
                      THEN EXTRACT(EPOCH FROM (o.updated_at - o.created_at)) / 60 
                      ELSE NULL END), 0) as avg_closure_minutes,
          COALESCE(SUM(CASE WHEN DATE(o.created_at) = CURRENT_DATE AND o.payment_status = 'PAID' 
                      THEN o.grand_total ELSE 0 END), 0) as settlements_today,
          (SELECT JSON_BUILD_OBJECT(
            'from_name', from_u.full_name,
            'to_name', to_u.full_name,
            'created_at', ho.created_at
          )
          FROM shift_handovers ho
          JOIN users from_u ON from_u.id = ho.from_user_id
          JOIN users to_u ON to_u.id = ho.to_user_id
          WHERE ho.from_user_id = u.id OR ho.to_user_id = u.id
          ORDER BY ho.created_at DESC LIMIT 1) as last_handover
        FROM users u
        LEFT JOIN shift_sessions ss ON ss.user_id = u.id AND ss.status = 'ACTIVE'
        LEFT JOIN orders o ON o.assigned_to_user_id = u.id
        WHERE u.outlet_id = $1
        GROUP BY u.id, ss.id, ss.status, ss.started_at
        ORDER BY u.role, u.full_name
      `;
      const result = await pool.query(query, [outletId]);
      return reply.send({ success: true, data: result.rows });
    } catch (err) {
      req.log.error(err);
      return reply.code(500).send({ error: 'Failed to fetch staff data', details: err.message });
    }
  });

  app.get('/api/v1/users/outlet/:outletId/staff/kpis', {
    preHandler: [authMiddleware, userContextMiddleware, roleMiddleware(['BRAND_OWNER'])]
  }, async (req, reply) => {
    const { outletId } = req.params;
    const result = await pool.query(`
      SELECT 
        COUNT(*) as total_staff,
        COUNT(CASE WHEN ss.status = 'ACTIVE' THEN 1 END) as on_shift,
        COALESCE(SUM(CASE WHEN DATE(ho.created_at) = CURRENT_DATE THEN 1 END), 0) as handover_today,
        COALESCE(AVG(CASE WHEN o.order_status = 'COMPLETED' 
                    THEN EXTRACT(EPOCH FROM (o.updated_at - o.created_at)) / 60 
                    ELSE NULL END), 0) as avg_closure_minutes
      FROM users u
      LEFT JOIN shift_sessions ss ON ss.user_id = u.id AND ss.status = 'ACTIVE'
      LEFT JOIN shift_handovers ho ON ho.from_user_id = u.id OR ho.to_user_id = u.id
      LEFT JOIN orders o ON o.assigned_to_user_id = u.id AND DATE(o.created_at) = CURRENT_DATE
      WHERE u.outlet_id = $1
      GROUP BY u.outlet_id
    `, [outletId]);
    return reply.send({ success: true, data: result.rows[0] });
  });
}

module.exports = userRoutes;