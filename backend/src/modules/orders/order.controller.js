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

module.exports = {
  createOrder,
  updateOrderStatus
};