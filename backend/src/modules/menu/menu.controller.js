const {
  createCategorySchema,
  createMenuItemSchema,
  createComboSchema
} = require('./menu.schema');

const menuService =
  require('./menu.service');

const fs =
  require('fs');

const path =
  require('path');

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

async function listCategories(request, reply) {

  const { organizationId, outletId } =
    request.query;

  if (!organizationId || !outletId) {
    return reply.status(400).send({
      success: false,
      message: 'organizationId and outletId are required'
    });
  }

  const categories =
    await menuService.listCategories(
      organizationId,
      outletId
    );

  return reply.send({
    success: true,
    data: categories
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

async function listMenuItems(request, reply) {

  const { organizationId, outletId, categoryId } =
    request.query;

  if (!organizationId || !outletId) {
    return reply.status(400).send({
      success: false,
      message: 'organizationId and outletId are required'
    });
  }

  const items =
    await menuService.listMenuItems(
      organizationId,
      outletId,
      categoryId || null
    );

  return reply.send({
    success: true,
    data: items
  });
}

async function importCSV(
  request,
  reply
) {

  try {

    const parts =
      request.parts();

    let fileData = null;

    let organizationId =
      null;

    let outletId =
      null;

    for await (
      const part
      of parts
    ) {

      if (
        part.type === 'file'
      ) {

        fileData = part;

      } else {

        if (
          part.fieldname ===
          'organizationId'
        ) {

          organizationId =
            part.value;

        }

        if (
          part.fieldname ===
          'outletId'
        ) {

          outletId =
            part.value;

        }

      }

    }

    if (!organizationId || !outletId) {
      return reply.status(400).send({
        success: false,
        message: 'organizationId and outletId are required'
      });
    }

    if (!fileData) {

      return reply.status(400).send({

        success: false,
        message:
          'CSV file missing'

      });

    }

    const filePath =
      path.join(

        __dirname,

        '../../../uploads',

        fileData.filename

      );

    await fs.promises.mkdir(

      path.dirname(filePath),

      {
        recursive: true
      }

    );

    await fs.promises.writeFile(

      filePath,

      await fileData.toBuffer()

    );

    const summary =
      await menuService
        .importMenuCSV(
          filePath,
          organizationId,
          outletId
        );

    // Clean up uploaded file
    await fs.promises.unlink(filePath);

    return reply.send({
      success: true,
      message: 'CSV import complete',
      summary
    });

  } catch (error) {

    console.log(error);

    return reply.status(500).send({

      success: false,
      message:
        error.message

    });

  }

}

async function updateMenuItem(request, reply) {
  const { id } = request.params;
  const { name, basePrice, description, isVeg, taxPercentage, isAvailable } = request.body;
  try {
    const item = await menuService.updateMenuItem(id, {
      name, basePrice, description, isVeg, taxPercentage, isAvailable
    }, request.userContext);
    return reply.send({ success: true, data: item });
  } catch (err) {
    return reply.status(400).send({ success: false, message: err.message });
  }
}

async function deleteMenuItem(request, reply) {
  const { id } = request.params;
  try {
    await menuService.deleteMenuItem(id, request.userContext);
    return reply.send({ success: true, message: 'Item deleted' });
  } catch (err) {
    return reply.status(400).send({ success: false, message: err.message });
  }
}

async function createCombo(request, reply) {
  const parsed = createComboSchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.status(400).send({ success: false, error: parsed.error });
  }
  const combo = await menuService.createCombo(parsed.data);
  return reply.send({ success: true, data: combo });
}

async function listPublicCategories(request, reply) {
  const { organizationId, outletId } = request.query;
  if (!organizationId || !outletId) {
    return reply.status(400).send({ success: false, message: 'Missing organizationId or outletId' });
  }
  const categories = await menuService.listCategories(organizationId, outletId);
  return reply.send({ success: true, data: categories });
}

async function listPublicMenuItems(request, reply) {
  const { organizationId, outletId, categoryId } = request.query;
  if (!organizationId || !outletId) {
    return reply.status(400).send({ success: false, message: 'Missing organizationId or outletId' });
  }
  const items = await menuService.listMenuItems(organizationId, outletId, categoryId || null, false);
  return reply.send({ success: true, data: items });
}

module.exports = {
  createCategory,
  listCategories,
  createMenuItem,
  listMenuItems,
  importCSV,
  updateMenuItem,
  deleteMenuItem,
  createCombo,
  listPublicCategories,
  listPublicMenuItems
};