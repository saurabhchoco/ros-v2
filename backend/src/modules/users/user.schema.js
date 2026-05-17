const { z } = require('zod');

const createUserSchema = z.object({

  firebaseUid: z.string(),

  organizationId: z.string(),

  outletId: z.string().optional(),

  fullName: z.string().min(2),

  email: z.string().email(),

  role: z.enum([
    'SUPER_ADMIN',
    'ORG_ADMIN',
    'OUTLET_MANAGER',
    'CASHIER',
    'KITCHEN',
    'CAPTAIN'
  ])
});

module.exports = {
  createUserSchema
};