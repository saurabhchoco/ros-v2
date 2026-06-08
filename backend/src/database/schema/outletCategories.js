const {
  pgTable,
  varchar,
  boolean,
  integer,
  timestamp,
  unique
} = require('drizzle-orm/pg-core');

const outletCategories = pgTable(
  'outlet_categories',
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

    name: varchar('name', {
      length: 255
    }).notNull(),

    description: varchar(
      'description',
      { length: 1000 }
    ),

    displayOrder: integer(
      'display_order'
    ).default(0),

    isActive: boolean(
      'is_active'
    ).default(true),

    createdAt: timestamp(
      'created_at'
    ).defaultNow(),

    updatedAt: timestamp(
      'updated_at'
    ).defaultNow()
  },

  (table) => ({
    outletCategoryUnique: unique(
      'uq_outlet_category_name'
    ).on(
      table.organizationId,
      table.outletId,
      table.name
    )
  })
);

module.exports = {
  outletCategories
};