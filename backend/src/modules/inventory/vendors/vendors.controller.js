const {
  createVendorSchema,
  updateVendorSchema
} = require('./vendors.schema');

const vendorsService =
  require('./vendors.service');

async function createVendor(
  request,
  reply
) {

  const parsed =
    createVendorSchema.safeParse(
      request.body
    );

  if (!parsed.success) {

    return reply.status(400).send({
      success: false,
      error: parsed.error
    });

  }

  try {

    const vendor =
      await vendorsService.createVendor(
        parsed.data,
        request.userContext.organization_id
      );

    return reply.send({
      success: true,
      data: vendor
    });

  } catch (error) {

    return reply.status(400).send({
      success: false,
      message: error.message
    });

  }

}

async function listVendors(
  request,
  reply
) {

  try {

    const vendors =
      await vendorsService.listVendors(
        request.userContext.organization_id
      );

    return reply.send({
      success: true,
      data: vendors
    });

  } catch (error) {

    return reply.status(500).send({
      success: false,
      message: error.message
    });

  }

}

async function updateVendor(
  request,
  reply
) {

  const parsed =
    updateVendorSchema.safeParse(
      request.body
    );

  if (!parsed.success) {

    return reply.status(400).send({
      success: false,
      error: parsed.error
    });

  }

  try {

    const vendor =
      await vendorsService.updateVendor(
        request.params.id,
        parsed.data,
        request.userContext.organization_id
      );

    return reply.send({
      success: true,
      data: vendor
    });

  } catch (error) {

    return reply.status(400).send({
      success: false,
      message: error.message
    });

  }

}

async function deactivateVendor(
  request,
  reply
) {

  try {

    const vendor =
      await vendorsService.deactivateVendor(
        request.params.id,
        request.userContext.organization_id
      );

    return reply.send({
      success: true,
      data: vendor
    });

  } catch (error) {

    return reply.status(400).send({
      success: false,
      message: error.message
    });

  }

}

module.exports = {
  createVendor,
  listVendors,
  updateVendor,
  deactivateVendor
};