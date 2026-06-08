const {
  pgTable,
  varchar,
  boolean,
  timestamp,
  unique
} = require('drizzle-orm/pg-core');

const masterItems = pgTable(
  'master_items',
  {
    id: varchar('id', {
      length: 40
    }).primaryKey(),

    organizationId: varchar(
      'organization_id',
      { length: 40 }
    ).notNull(),

    itemCode: varchar(
      'item_code',
      { length: 100 }
    ),

    name: varchar('name', {
      length: 255
    }).notNull(),

    normalizedName: varchar(
      'normalized_name',
      { length: 255 }
    ).notNull(),

    description: varchar(
      'description',
      { length: 1000 }
    ),

    itemType: varchar(
      'item_type',
      { length: 50 }
    ).notNull(),

    primaryUnitId: varchar(
      'primary_unit_id',
      { length: 40 }
    ).notNull(),

    defaultVendorId: varchar(
      'default_vendor_id',
      { length: 40 }
    ),

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
    uniqueNormalizedName: unique(
      'uq_master_items_org_normalized_name'
    ).on(
      table.organizationId,
      table.normalizedName
    )
  })
);

module.exports = {
  masterItems
};