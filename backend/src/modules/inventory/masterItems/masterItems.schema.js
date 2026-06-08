const { z } = require('zod');

const createMasterItemSchema = z.object({
  itemCode: z.string().max(100).optional(),

  name: z.string()
    .min(2)
    .max(255),

  description: z.string()
    .max(1000)
    .optional(),

  itemType: z.enum([
    'RAW_MATERIAL',
    'PACKAGING',
    'CONSUMABLE',
    'FINISHED_GOOD'
  ]),

  primaryUnitId: z.string(),

  defaultVendorId: z.string().optional()
});

const updateMasterItemSchema = z.object({
  itemCode: z.string().max(100).optional(),

  name: z.string()
    .min(2)
    .max(255)
    .optional(),

  description: z.string()
    .max(1000)
    .optional(),

  itemType: z.enum([
    'RAW_MATERIAL',
    'PACKAGING',
    'CONSUMABLE',
    'FINISHED_GOOD'
  ]).optional(),

  primaryUnitId: z.string().optional(),

  defaultVendorId: z.string().optional(),

  isActive: z.boolean().optional()
});

module.exports = {
  createMasterItemSchema,
  updateMasterItemSchema
};