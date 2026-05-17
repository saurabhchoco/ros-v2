const {
  createOutletSchema
} = require('./outlet.schema');

const outletService = require('./outlet.service');

const admin =
  require('../../config/firebase');

const {
  createOutletManagerSchema
} = require('./outlet.schema');

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

async function createOutletManager(
  request,
  reply
) {

  const parsed =
    createOutletManagerSchema
      .safeParse(
        request.body
      );

  if (!parsed.success) {

    return reply.status(400).send({

      success: false,
      error:
        parsed.error

    });

  }

  try {

    const data =
      parsed.data;

    const firebaseUser =
      await admin.auth()
        .createUser({

          email:
            data.email,

          password:
            data.password,

          displayName:
            data.fullName

        });

    const manager =
      await outletService
        .createOutletManager(

          data,
          firebaseUser.uid

        );

    return reply.send({

      success: true,
      data: manager

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
  createOutlet,
  listOutlets,
  createOutletManager
};