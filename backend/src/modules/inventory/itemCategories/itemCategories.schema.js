const { z } = require('zod');

const assignItemCategorySchema = z.object({

  outletId: z.string(),

  masterItemId: z.string(),

  categoryId: z.string()

});

module.exports = {
  assignItemCategorySchema
};