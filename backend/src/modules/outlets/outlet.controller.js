const {
  createOutletSchema
} = require('./outlet.schema');

const outletService = require('./outlet.service');

async function createOutlet(request, reply) {

  const parsed = createOutletSchema.safeParse(
    request.body
  );

  if (!parsed.success) {
    return reply.status(400).send({
      success: false,
      message: 'Validation failed',
      error: parsed.error
    });
  }

  const outlet = await outletService.createOutlet(
    parsed.data
  );

  return reply.send({
    success: true,
    message: 'Outlet created successfully',
    data: outlet
  });
}

async function listOutlets(request, reply) {

  const outlets = await outletService.listOutlets();

  return reply.send({
    success: true,
    data: outlets
  });
}

module.exports = {
  createOutlet,
  listOutlets
};