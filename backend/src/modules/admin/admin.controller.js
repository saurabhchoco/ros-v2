const adminService =
  require('./admin.service');

const {
  successResponse,
  errorResponse
} = require('../../utils/apiResponse');

// ── Brand ─────────────────────────────────

async function createBrand(request, reply) {
  const data = request.body;

  const firebaseUser =
    await adminService.createFirebaseUser(
      data.ownerEmail,
      data.password,
      data.ownerName
    );

  const organization =
    await adminService.createOrganization(data);

  const brandOwner =
    await adminService.createBrandOwner(
      data,
      firebaseUser.uid,
      organization.id
    );

  return reply.send(
    successResponse(
      { organization, brandOwner },
      'Brand created successfully'
    )
  );
}

async function listBrands(request, reply) {
  const organizations =
    await adminService.listOrganizations();

  return reply.send(
    successResponse(organizations)
  );
}

// ── Outlet ────────────────────────────────

async function createOutlet(request, reply) {
  const data = request.body;

  const outlet =
    await adminService.createOutlet(data);

  return reply.send(
    successResponse(outlet, 'Outlet created successfully')
  );
}

async function listOutlets(request, reply) {
  const { organizationId } = request.query;

  const outlets =
    await adminService.listOutlets(
      organizationId || null
    );

  return reply.send(
    successResponse(outlets)
  );
}

// ── Outlet Manager ────────────────────────

async function createOutletManager(
  request,
  reply
) {
  const data = request.body;

  const firebaseUser =
    await adminService.createFirebaseUser(
      data.email,
      data.password,
      data.fullName
    );

  const manager =
    await adminService.createOutletManager(
      data,
      firebaseUser.uid
    );

  return reply.send(
    successResponse(manager, 'Outlet manager created successfully')
  );
}

// ── Users ─────────────────────────────────

async function listUsers(request, reply) {
  const { organizationId } = request.query;

  const users =
    await adminService.listUsers(
      organizationId || null
    );

  return reply.send(
    successResponse(users)
  );
}

module.exports = {
  createBrand,
  listBrands,
  createOutlet,
  listOutlets,
  createOutletManager,
  listUsers
};