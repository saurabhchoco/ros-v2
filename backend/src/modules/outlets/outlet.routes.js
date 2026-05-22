const outletController = require('./outlet.controller');
const authMiddleware = require('../../middleware/authMiddleware');
const userContextMiddleware = require('../../middleware/userContextMiddleware');
const roleMiddleware = require('../../middleware/roleMiddleware');
const outletService = require('./outlet.service');
const pool = require('../../config/db');
const admin = require('../../config/firebase');

const brandOwnerOnly = [
  authMiddleware,
  userContextMiddleware,
  roleMiddleware(['BRAND_OWNER'])
];

async function outletRoutes(app) {

  app.post(
    '/api/v1/outlets/create',
    {
      preHandler: [
        authMiddleware,
        userContextMiddleware,
        roleMiddleware(['BRAND_OWNER'])
      ]
    },
    outletController.createOutlet
  );

  app.get(
    '/api/v1/outlets/list',
    {
      preHandler: [
        authMiddleware,
        userContextMiddleware
      ]
    },
    outletController.listOutlets
  );

  app.post(
    '/api/v1/outlets/create-manager',
    {
      preHandler: [
        authMiddleware,
        userContextMiddleware,
        roleMiddleware(['BRAND_OWNER'])
      ]
    },
    outletController.createOutletManager
  );

  // Brand Owner — list their own outlets
  app.get(
    '/api/v1/outlets/my',
    { preHandler: brandOwnerOnly },
    async (request, reply) => {
      const orgId = request.userContext.organization_id || request.userContext.organizationId;
      const outlets = await outletService.listOutlets(orgId);
      return reply.send({
        success: true,
        data: outlets
      });
    }
  );

  // Brand Owner — create outlet
  app.post(
    '/api/v1/outlets',
    { preHandler: brandOwnerOnly },
    outletController.createOutlet
  );

  app.get(
    '/api/v1/outlets/managers',
    { preHandler: brandOwnerOnly },
    outletController.listManagers
  );
  // ✅ NEW: Vendor authentication (no JWT, uses PIN)
// Vendor authentication with Firebase custom token
app.post('/api/v1/vendor/auth', async (request, reply) => {
  const { outletId, pin } = request.body;
  if (!outletId || !pin) {
    return reply.status(400).send({ success: false, message: 'Missing outletId or pin' });
  }
  try {
    const result = await pool.query(
      `SELECT id, name, token_prefix, organization_id FROM outlets WHERE id = $1 AND vendor_pin = $2`,
      [outletId, pin]
    );
    if (result.rows.length === 0) {
      return reply.status(401).send({ success: false, message: 'Invalid PIN' });
    }
    
    const outlet = result.rows[0];
    
    // Create Firebase custom token with outlet claims
    const customToken = await admin.auth().createCustomToken(outlet.id, {
      outletId: outlet.id,
      organizationId: outlet.organization_id,
      role: 'VENDOR'
    });
    
    return reply.send({ 
      success: true, 
      outlet: { id: outlet.id, name: outlet.name, token_prefix: outlet.token_prefix },
      firebaseToken: customToken
    });
  } catch (err) {
    console.error(err);
    return reply.status(500).send({ success: false, message: 'Server error' });
  }
});

  // ✅ NEW: Public outlet info (no auth)
  app.get('/api/v1/public/outlet/:outletId', async (request, reply) => {
    const { outletId } = request.params;
    try {
      const result = await pool.query(
        `SELECT id, organization_id, name, token_prefix, upi_qr FROM outlets WHERE id = $1`,
        [outletId]
      );
      if (result.rows.length === 0) {
        return reply.status(404).send({ success: false, message: 'Outlet not found' });
      }
      return reply.send({ success: true, data: result.rows[0] });
    } catch (err) {
      console.error(err);
      return reply.status(500).send({ success: false, message: 'Server error' });
    }
  });

  // ✅ NEW: Get pending orders for vendor
  app.get('/api/v1/vendor/orders/:outletId', async (request, reply) => {
    const { outletId } = request.params;
    try {
      const orders = await pool.query(
        `SELECT o.id, o.token_number, o.order_status, o.grand_total,
                json_agg(json_build_object('name', oi.item_name, 'quantity', oi.quantity)) as items
         FROM orders o
         LEFT JOIN order_items oi ON o.id = oi.order_id
         WHERE o.outlet_id = $1 AND o.order_status IN ('NEW','PREPARING','READY')
         GROUP BY o.id
         ORDER BY o.created_at ASC`,
        [outletId]
      );
      return reply.send({ success: true, data: orders.rows });
    } catch (err) {
      console.error(err);
      return reply.status(500).send({ success: false, message: 'Failed to fetch orders' });
    }
  });
}

module.exports = outletRoutes;
