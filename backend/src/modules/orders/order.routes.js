const orderController =
  require('./order.controller');

const authMiddleware =
  require('../../middleware/authMiddleware');

const userContextMiddleware =
  require('../../middleware/userContextMiddleware');

const orderAccessMiddleware =
  require('../../middleware/orderAccessMiddleware');

async function orderRoutes(app) {

  app.post(
    '/api/v1/orders/create',
    {
      preHandler: [
        authMiddleware,
        userContextMiddleware,
        orderAccessMiddleware
      ]
    },
    orderController.createOrder
  );

  app.patch(
    '/api/v1/orders/:orderId/status',
    {
      preHandler: [
        authMiddleware,
        userContextMiddleware
      ]
    },
    orderController.updateOrderStatus
  );

}

module.exports = orderRoutes;