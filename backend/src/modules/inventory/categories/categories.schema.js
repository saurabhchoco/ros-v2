const { z } = require('zod');

const createCategorySchema = z.object({
  outletId: z.string(),

  name: z.string()
    .min(2)
    .max(255),

  description: z.string()
    .max(1000)
    .optional(),

  displayOrder: z.number()
    .optional()
});

const updateCategorySchema = z.object({
  name: z.string()
    .min(2)
    .max(255)
    .optional(),

  description: z.string()
    .max(1000)
    .optional(),

  displayOrder: z.number()
    .optional(),

  isActive: z.boolean()
    .optional()
});

module.exports = {
  createCategorySchema,
  updateCategorySchema
};