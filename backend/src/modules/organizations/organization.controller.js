const {
  createOrganizationSchema
} = require('./organization.schema');

const organizationService = require('./organization.service');

async function createOrganization(request, reply) {
  const parsed = createOrganizationSchema.safeParse(request.body);

  if (!parsed.success) {
    return reply.status(400).send({
      success: false,
      message: 'Validation failed',
      error: parsed.error
    });
  }

  const organization = await organizationService.createOrganization(
    parsed.data
  );

  return reply.send({
    success: true,
    message: 'Organization created successfully',
    data: organization
  });
}

async function listOrganizations(request, reply) {
  const organizations = await organizationService.listOrganizations();

  return reply.send({
    success: true,
    data: organizations
  });
}

module.exports = {
  createOrganization,
  listOrganizations
};