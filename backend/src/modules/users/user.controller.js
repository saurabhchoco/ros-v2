const admin = require('../../config/firebase');
const {
  createUserSchema
} = require('./user.schema');

const userService = require('./user.service');
const pool = require('../../config/db');

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

async function getMe(request, reply) {
  const firebaseUid = request.user.uid;
  const user = await userService.getUserByFirebaseUid(firebaseUid);

  await admin.auth().setCustomUserClaims(firebaseUid, {
    organizationId: user.organization_id,
    outletId: user.outlet_id,
    role: user.role
  });

  if (!user) {
    return reply.status(404).send({
      success: false,
      message: 'User not found'
    });
  }

  return reply.send({
    success: true,
    data: {
      id: user.id,
      fullName: user.full_name,
      email: user.email,
      role: user.role,
      organizationId: user.organization_id,
      outletId: user.outlet_id,
      organizationName: user.organization_name,  // ADD
      outletName: user.outlet_name,              // ADD
      outletType: user.outlet_type               // ADD
    }
  });
}

async function listOrganizationOutlets(request, reply) {
  const { organization_id } = request.userContext;
  try {
    // Remove 'address' and select only columns that exist
    const result = await pool.query(
      `SELECT id, name, status 
       FROM outlets 
       WHERE organization_id = $1 
       ORDER BY name`,
      [organization_id]
    );
    return reply.send({ success: true, data: result.rows });
  } catch (err) {
    request.log.error(err);
    return reply.code(500).send({ error: 'Failed to fetch outlets' });
  }
}

module.exports = {
  createUser,
  listUsers,
  getMe,
  listOrganizationOutlets
};