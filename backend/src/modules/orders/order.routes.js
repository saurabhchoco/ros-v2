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
}

module.exports = orderRoutes;