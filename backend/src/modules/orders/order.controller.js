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

module.exports = {
  createOrder
};