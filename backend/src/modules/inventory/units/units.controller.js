const {
  createUnitSchema,
  updateUnitSchema
} = require('./units.schema');

const unitsService = require('./units.service');

async function createUnit(request, reply) {
  const parsed = createUnitSchema.safeParse(request.body);

  if (!parsed.success) {
    return reply.status(400).send({
      success: false,
      error: parsed.error
    });
  }

  try {
    const organizationId =
      request.userContext.organization_id;

    const unit =
      await unitsService.createUnit(
        parsed.data,
        organizationId
      );

    return reply.send({
      success: true,
      data: unit
    });

  } catch (error) {
    request.log.error(error);

    return reply.status(400).send({
      success: false,
      message: error.message
    });
  }
}

async function listUnits(request, reply) {
  try {
    const organizationId =
      request.userContext.organization_id;

    const units =
      await unitsService.listUnits(
        organizationId
      );

    return reply.send({
      success: true,
      data: units
    });

  } catch (error) {
    request.log.error(error);

    return reply.status(500).send({
      success: false,
      message: error.message
    });
  }
}

async function updateUnit(request, reply) {
  const { id } = request.params;

  const parsed =
    updateUnitSchema.safeParse(
      request.body
    );

  if (!parsed.success) {
    return reply.status(400).send({
      success: false,
      error: parsed.error
    });
  }

  try {
    const organizationId =
      request.userContext.organization_id;

    const unit =
      await unitsService.updateUnit(
        id,
        parsed.data,
        organizationId
      );

    return reply.send({
      success: true,
      data: unit
    });

  } catch (error) {
    request.log.error(error);

    return reply.status(400).send({
      success: false,
      message: error.message
    });
  }
}

async function deactivateUnit(request, reply) {
  const { id } = request.params;

  try {
    const organizationId =
      request.userContext.organization_id;

    const unit =
      await unitsService.deactivateUnit(
        id,
        organizationId
      );

    return reply.send({
      success: true,
      data: unit,
      message: 'Unit deactivated successfully'
    });

  } catch (error) {
    request.log.error(error);

    return reply.status(400).send({
      success: false,
      message: error.message
    });
  }
}

module.exports = {
  createUnit,
  listUnits,
  updateUnit,
  deactivateUnit
};