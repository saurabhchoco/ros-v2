const { z } = require('zod');

const createOutletSchema = z.object({
  organizationId: z.string(),
  name: z.string().min(2).max(255),

  outletType: z.enum([
    'RESTAURANT',
    'CLOUD_KITCHEN',
    'FOCO',
    'FRANCHISE',
    'CENTRAL_KITCHEN'
  ])
});

module.exports = {
  createOutletSchema
};