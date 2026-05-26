const { z } = require('zod');

const createOutletSchema = z.object({
  organizationId: z.string(),
  name: z.string().min(2).max(255),

  outletType: z.enum([
    'RESTAURANT',
    'QSR',
    'CAFE',
    'BAKERY',
    'FOOD_COURT',
    'CLOUD_KITCHEN',
    'KIOSK',
    'STREET_FOOD'
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
        .min(6),
    role: z.enum(['OUTLET_MANAGER', 'CAPTAIN', 'KITCHEN', 'CASHIER', 'GSA', 'ARM']).default('OUTLET_MANAGER')
  });

module.exports = {
  createOutletSchema,
  createOutletManagerSchema
};