const {
  createOrderSchema
} = require('./order.schema');

const orderService =
  require('./order.service');

async function createOrder(
  request,
  reply
) {

  const parsed =
    createOrderSchema.safeParse(
      request.body
    );

  if (!parsed.success) {

    return reply.status(400).send({
      success: false,
      message: 'Validation failed',
      error: parsed.error
    });

  }

  const order =
    await orderService.createOrder(
      parsed.data
    );

  return reply.send({
    success: true,
    message: 'Order created successfully',
    data: order
  });
}

async function updateOrderStatus(
  request,
  reply
) {

  const { orderId } = request.params;
  const { status } = request.body;

  if (!status) {
    return reply.status(400).send({
      success: false,
      message: 'status is required in request body'
    });
  }

  const order =
    await orderService.updateOrderStatus(
      orderId,
      status,
      request.userContext
    );

  return reply.send({
    success: true,
    message: `Order status updated to ${status}`,
    data: order
  });

}

async function listOrders(
  request,
  reply
) {

  const { status, startDate, endDate } =
    request.query;

  const orders =
    await orderService.listOrders(
      request.userContext.organization_id,
      request.userContext.outlet_id,
      { status, startDate, endDate }
    );

  return reply.send({
    success: true,
    data: orders
  });

}

async function getOrderById(
  request,
  reply
) {

  const { orderId } = request.params;

  const order =
    await orderService.getOrderById(
      orderId,
      request.userContext.organization_id
    );

  return reply.send({
    success: true,
    data: order
  });

}

module.exports = {
  createOrder,
  updateOrderStatus,
  listOrders,
  getOrderById
};