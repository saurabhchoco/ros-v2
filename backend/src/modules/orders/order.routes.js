const orderController =
  require('./order.controller');
const syncClaims = 
  require('../../middleware/syncClaims');
const roleMiddleware = 
  require('../../middleware/roleMiddleware');
const authMiddleware =
  require('../../middleware/authMiddleware');
const userContextMiddleware =
  require('../../middleware/userContextMiddleware');
const orderAccessMiddleware =
  require('../../middleware/orderAccessMiddleware');
const { z } = require('zod');

async function orderRoutes(app) {

  app.post(
    '/api/v1/orders/create',
    {
      preHandler: [
        authMiddleware,
        userContextMiddleware,
        roleMiddleware(['CAPTAIN', 'OUTLET_MANAGER']),
        orderAccessMiddleware
      ]
    },
    orderController.createOrder
  );

  app.get(
    '/api/v1/orders',
    {
      preHandler: [
        authMiddleware,
        userContextMiddleware
      ]
    },
    orderController.listOrders
  );

  app.get(
    '/api/v1/orders/:orderId',
    {
      preHandler: [
        authMiddleware,
        userContextMiddleware
      ]
    },
    orderController.getOrderById
  );

  app.patch(
    '/api/v1/orders/:orderId/status',
    {
      preHandler: [
        authMiddleware,
        syncClaims,
        userContextMiddleware
      ]
    },
    orderController.updateOrderStatus
  );

  // ✅ NEW: Public order creation (no authentication)
  app.post('/api/v1/public/orders', orderController.createPublicOrder);

}

module.exports = orderRoutes;