const {
  createCategorySchema,
  updateCategorySchema
} = require('./categories.schema');

const categoriesService =
  require('./categories.service');

async function createCategory(
  request,
  reply
) {

  const parsed =
    createCategorySchema.safeParse(
      request.body
    );

  if (!parsed.success) {
    return reply.status(400).send({
      success: false,
      error: parsed.error
    });
  }

  try {

    const category =
      await categoriesService.createCategory(
        parsed.data,
        request.userContext.organization_id
      );

    return reply.send({
      success: true,
      data: category
    });

  } catch (error) {

    return reply.status(400).send({
      success: false,
      message: error.message
    });

  }
}

async function listCategories(
  request,
  reply
) {

  try {

    const { outletId } =
      request.query;

    const categories =
      await categoriesService.listCategories(
        outletId,
        request.userContext.organization_id
      );

    return reply.send({
      success: true,
      data: categories
    });

  } catch (error) {

    return reply.status(500).send({
      success: false,
      message: error.message
    });

  }
}

async function updateCategory(
  request,
  reply
) {

  const parsed =
    updateCategorySchema.safeParse(
      request.body
    );

  if (!parsed.success) {
    return reply.status(400).send({
      success: false,
      error: parsed.error
    });
  }

  try {

    const category =
      await categoriesService.updateCategory(
        request.params.id,
        parsed.data,
        request.userContext.organization_id
      );

    return reply.send({
      success: true,
      data: category
    });

  } catch (error) {

    return reply.status(400).send({
      success: false,
      message: error.message
    });

  }
}

async function deactivateCategory(
  request,
  reply
) {

  try {

    const category =
      await categoriesService.deactivateCategory(
        request.params.id,
        request.userContext.organization_id
      );

    return reply.send({
      success: true,
      data: category
    });

  } catch (error) {

    return reply.status(400).send({
      success: false,
      message: error.message
    });

  }
}

module.exports = {
  createCategory,
  listCategories,
  updateCategory,
  deactivateCategory
};