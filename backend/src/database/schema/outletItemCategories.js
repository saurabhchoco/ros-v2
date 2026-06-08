const {
  pgTable,
  varchar,
  timestamp,
  unique
} = require('drizzle-orm/pg-core');

const outletItemCategories = pgTable(
  'outlet_item_categories',
  {
    id: varchar('id', {
      length: 40
    }).primaryKey(),

    organizationId: varchar(
      'organization_id',
      { length: 40 }
    ).notNull(),

    outletId: varchar(
      'outlet_id',
      { length: 40 }
    ).notNull(),

    masterItemId: varchar(
      'master_item_id',
      { length: 40 }
    ).notNull(),

    categoryId: varchar(
      'category_id',
      { length: 40 }
    ).notNull(),

    createdAt: timestamp(
      'created_at'
    ).defaultNow(),

    updatedAt: timestamp(
      'updated_at'
    ).defaultNow()
  },
  (table) => ({
    outletItemUnique: unique(
      'uq_outlet_item_category'
    ).on(
      table.outletId,
      table.masterItemId
    )
  })
);

module.exports = {
  outletItemCategories
};