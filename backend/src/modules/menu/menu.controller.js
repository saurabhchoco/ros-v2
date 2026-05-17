const {
  createCategorySchema,
  createMenuItemSchema
} = require('./menu.schema');

const menuService =
  require('./menu.service');

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

  const category =
    await menuService
      .createCategory(
        parsed.data
      );

  return reply.send({
    success: true,
    data: category
  });
}

async function listCategories(
  request,
  reply
) {

  const {
    organizationId,
    outletId
  } = request.query;

  const data =
    await menuService
      .listCategories(
        organizationId,
        outletId
      );

  return reply.send({
    success: true,
    data
  });
}

async function createMenuItem(
  request,
  reply
) {

  const parsed =
    createMenuItemSchema.safeParse(
      request.body
    );

  if (!parsed.success) {

    return reply.status(400).send({
      success: false,
      error: parsed.error
    });

  }

  const item =
    await menuService
      .createMenuItem(
        parsed.data
      );

  return reply.send({
    success: true,
    data: item
  });
}

async function listMenuItems(
  request,
  reply
) {

  const {
    organizationId,
    outletId
  } = request.query;

  const data =
    await menuService
      .listMenuItems(
        organizationId,
        outletId
      );

  return reply.send({
    success: true,
    data
  });
}

module.exports = {
  createCategory,
  listCategories,
  createMenuItem,
  listMenuItems
};