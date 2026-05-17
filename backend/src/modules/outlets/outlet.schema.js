const { z } = require('zod');

const createOutletSchema = z.object({
  organizationId: z.string(),
  name: z.string().min(2).max(255),

  outletType: z.enum([
    'RESTAURANT',
    'QSR',
    'CLOUD_KITCHEN',
    'FOCO',
    'FRANCHISE',
    'CENTRAL_KITCHEN'
  ])
});

const createOutletManagerSchema =
  z.object({

    organizationId:
      z.string(),

    outletId:
      z.string(),

    fullName:
      z.string()
        .min(2),

    email:
      z.email(),

    password:
      z.string()
        .min(6)

  });

module.exports = {
  createOutletSchema,
  createOutletManagerSchema
};