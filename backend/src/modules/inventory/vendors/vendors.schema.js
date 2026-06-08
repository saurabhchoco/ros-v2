const { z } = require('zod');

const createVendorSchema = z.object({
  name: z.string().min(2).max(255),

  contactPerson: z.string().max(255).optional(),

  phone: z.string().max(50).optional(),

  email: z.string().email().optional(),

  gstNumber: z.string().max(100).optional(),

  address: z.string().max(1000).optional()
});

const updateVendorSchema = z.object({
  name: z.string().min(2).max(255).optional(),

  contactPerson: z.string().max(255).optional(),

  phone: z.string().max(50).optional(),

  email: z.string().email().optional(),

  gstNumber: z.string().max(100).optional(),

  address: z.string().max(1000).optional(),

  isActive: z.boolean().optional()
});

module.exports = {
  createVendorSchema,
  updateVendorSchema
};