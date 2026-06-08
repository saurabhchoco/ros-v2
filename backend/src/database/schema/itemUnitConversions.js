const {
  pgTable,
  varchar,
  numeric,
  timestamp
} = require('drizzle-orm/pg-core');

const itemUnitConversions = pgTable(
  'item_unit_conversions',
  {
    id: varchar('id', { length: 40 }).primaryKey(),

    organizationId: varchar(
      'organization_id',
      { length: 40 }
    ).notNull(),

    fromUnitId: varchar(
      'from_unit_id',
      { length: 40 }
    ).notNull(),

    toUnitId: varchar(
      'to_unit_id',
      { length: 40 }
    ).notNull(),

    conversionFactor: numeric(
      'conversion_factor',
      {
        precision: 18,
        scale: 6
      }
    ).notNull(),

    createdAt: timestamp(
      'created_at'
    ).defaultNow(),

    updatedAt: timestamp(
      'updated_at'
    ).defaultNow()
  }
);

module.exports = {
  itemUnitConversions
};