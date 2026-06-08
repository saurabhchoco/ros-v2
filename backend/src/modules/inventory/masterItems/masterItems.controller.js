const {
  createMasterItemSchema,
  updateMasterItemSchema
} = require('./masterItems.schema');

const masterItemsService =
  require('./masterItems.service');

async function createMasterItem(
  request,
  reply
) {

  const parsed =
    createMasterItemSchema.safeParse(
      request.body
    );

  if (!parsed.success) {
    return reply.status(400).send({
      success: false,
      error: parsed.error
    });
  }

  try {

    const item =
      await masterItemsService.createMasterItem(
        parsed.data,
        request.userContext.organization_id
      );

    return reply.send({
      success: true,
      data: item
    });

  } catch (error) {

    return reply.status(400).send({
      success: false,
      message: error.message
    });

  }
}

async function listMasterItems(
  request,
  reply
) {

  try {

    const items =
      await masterItemsService.listMasterItems(
        request.userContext.organization_id
      );

    return reply.send({
      success: true,
      data: items
    });

  } catch (error) {

    return reply.status(500).send({
      success: false,
      message: error.message
    });

  }
}

async function updateMasterItem(
  request,
  reply
) {

  const parsed =
    updateMasterItemSchema.safeParse(
      request.body
    );

  if (!parsed.success) {
    return reply.status(400).send({
      success: false,
      error: parsed.error
    });
  }

  try {

    const item =
      await masterItemsService.updateMasterItem(
        request.params.id,
        parsed.data,
        request.userContext.organization_id
      );

    return reply.send({
      success: true,
      data: item
    });

  } catch (error) {

    return reply.status(400).send({
      success: false,
      message: error.message
    });

  }
}

async function deactivateMasterItem(
  request,
  reply
) {

  try {

    const item =
      await masterItemsService.deactivateMasterItem(
        request.params.id,
        request.userContext.organization_id
      );

    return reply.send({
      success: true,
      data: item
    });

  } catch (error) {

    return reply.status(400).send({
      success: false,
      message: error.message
    });

  }
}

module.exports = {
  createMasterItem,
  listMasterItems,
  updateMasterItem,
  deactivateMasterItem
};