const {
  createUserSchema
} = require('./user.schema');

const userService = require('./user.service');

async function createUser(request, reply) {

  const parsed = createUserSchema.safeParse(
    request.body
  );

  if (!parsed.success) {
    return reply.status(400).send({
      success: false,
      message: 'Validation failed',
      error: parsed.error
    });
  }

  const user = await userService.createUser(
    parsed.data
  );

  return reply.send({
    success: true,
    message: 'User created successfully',
    data: user
  });
}

async function listUsers(request, reply) {

  const users = await userService.listUsers();

  return reply.send({
    success: true,
    data: users
  });
}

async function getMe(
  request,
  reply
) {

  const firebaseUid =
    request.user.uid;

  const user =
    await userService
      .getUserByFirebaseUid(
        firebaseUid
      );

  if (!user) {

    return reply.status(404).send({

      success: false,
      message: 'User not found'

    });

  }

  return reply.send({

    success: true,

    data: {

      id:
        user.id,

      fullName:
        user.full_name,

      email:
        user.email,

      role:
        user.role,

      organizationId:
        user.organization_id,

      outletId:
        user.outlet_id

    }

  });

}

async function updateMe(request, reply) {
  try {
    const firebaseUid = request.user.uid;
    const { fullName, email } = request.body;

    if (!fullName && !email) {
      return reply.status(400).send({
        success: false,
        message: 'At least one field (fullName or email) is required'
      });
    }

    const user = await userService.updateUser(
      firebaseUid,
      { fullName, email }
    );

    if (!user) {
      return reply.status(404).send({
        success: false,
        message: 'User not found'
      });
    }

    return reply.send({
      success: true,
      message: 'User updated successfully',
      data: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        role: user.role,
        organizationId: user.organization_id,
        outletId: user.outlet_id
      }
    });
  } catch (error) {
    console.error('Update user error:', error);
    return reply.status(500).send({
      success: false,
      message: 'Failed to update user',
      error: error.message
    });
  }
}

module.exports = {
  createUser,
  listUsers,
  getMe,
  updateMe
};
