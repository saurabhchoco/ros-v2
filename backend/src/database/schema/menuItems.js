const {
  pgTable,
  varchar,
  boolean,
  numeric,
  timestamp
} = require('drizzle-orm/pg-core');

const menuItems = pgTable(
  'menu_items',
  {

    id: varchar('id', {
      length: 40
    }).primaryKey(),

    organizationId: varchar(
      'organization_id',
      {
        length: 40
      }
    ).notNull(),

    outletId: varchar(
      'outlet_id',
      {
        length: 40
      }
    ).notNull(),

    categoryId: varchar(
      'category_id',
      {
        length: 40
      }
    ).notNull(),

    itemCode: varchar(
      'item_code',
      {
        length: 100
      }
    ),

    name: varchar('name', {
      length: 255
    }).notNull(),

    description: varchar(
      'description',
      {
        length: 1000
      }
    ),

    basePrice: numeric(
      'base_price',
      {
        precision: 12,
        scale: 2
      }
    ).notNull(),

    taxPercentage: numeric(
      'tax_percentage',
      {
        precision: 5,
        scale: 2
      }
    ).default('0'),

    isVeg: boolean(
      'is_veg'
    ).default(false),

    isAvailable: boolean(
      'is_available'
    ).default(true),

    imageUrl: varchar(
      'image_url',
      {
        length: 1000
      }
    ),

    createdAt: timestamp(
      'created_at'
    ).defaultNow(),

    updatedAt: timestamp(
      'updated_at'
    ).defaultNow()

  }
);

module.exports = {
  menuItems
};