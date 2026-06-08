const {
  assignItemCategorySchema
} = require('./itemCategories.schema');

const itemCategoriesService =
  require('./itemCategories.service');

async function assignItemCategory(
  request,
  reply
) {

  const parsed =
    assignItemCategorySchema.safeParse(
      request.body
    );

  if (!parsed.success) {

    return reply.status(400).send({
      success: false,
      error: parsed.error
    });

  }

  try {

    const result =
      await itemCategoriesService.assignItemCategory(
        parsed.data,
        request.userContext.organization_id
      );

    return reply.send({
      success: true,
      data: result
    });

  } catch (error) {

    return reply.status(400).send({
      success: false,
      message: error.message
    });

  }
}

async function listItemCategories(
  request,
  reply
) {

  try {

    const { outletId } =
      request.query;

    const result =
      await itemCategoriesService.listItemCategories(
        outletId,
        request.userContext.organization_id
      );

    return reply.send({
      success: true,
      data: result
    });

  } catch (error) {

    return reply.status(500).send({
      success: false,
      message: error.message
    });

  }
}

async function removeItemCategory(
  request,
  reply
) {

  try {

    const result =
      await itemCategoriesService.removeItemCategory(
        request.params.id,
        request.userContext.organization_id
      );

    return reply.send({
      success: true,
      data: result
    });

  } catch (error) {

    return reply.status(400).send({
      success: false,
      message: error.message
    });

  }
}

module.exports = {
  assignItemCategory,
  listItemCategories,
  removeItemCategory
};