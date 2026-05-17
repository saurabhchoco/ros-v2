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
      z.string(),

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

module.exports = {
  createCategorySchema,
  createMenuItemSchema
};