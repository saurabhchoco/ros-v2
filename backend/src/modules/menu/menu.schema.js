const { z } = require('zod');

const createCategorySchema =
  z.object({

    organizationId:
      z.string(),

    outletId:
      z.string(),

    name:
      z.string().min(2),

    description:
      z.string().optional()

  });

const createMenuItemSchema =
  z.object({

    organizationId:
      z.string(),

    outletId:
      z.string(),

    categoryId:
      z.string().optional().nullable(),

    itemCode:
      z.string().optional(),

    name:
      z.string().min(2),

    description:
      z.string().optional(),

    basePrice:
      z.number(),

    taxPercentage:
      z.number().optional(),

    isVeg:
      z.boolean().optional()

  });

const createComboSchema = z.object({
  organizationId: z.string(),
  outletId: z.string(),
  categoryId: z.string(),
  name: z.string().min(2),
  basePrice: z.number().positive(),
  components: z.array(z.object({
    itemId: z.string(),
    quantity: z.number().int().positive(),
    discountPercent: z.number().min(0).max(100).optional()
  }))
});

module.exports = {
  createCategorySchema,
  createMenuItemSchema,
  createComboSchema
};