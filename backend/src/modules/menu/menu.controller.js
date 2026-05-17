const {
  createCategorySchema,
  createMenuItemSchema
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

module.exports = {
  createCategory,
  listCategories,
  createMenuItem,
  listMenuItems,
  importCSV
};