const { z } = require('zod');

const createOrganizationSchema = z.object({
  name: z.string().min(2).max(255)
});

module.exports = {
  createOrganizationSchema
};