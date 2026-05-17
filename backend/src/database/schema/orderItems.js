const {
  pgTable,
  varchar,
  numeric,
  text,
  timestamp
} = require('drizzle-orm/pg-core');

const orderItems = pgTable('order_items', {

  id: varchar('id', {
    length: 40
  }).primaryKey(),

  orderId: varchar('order_id', {
    length: 40
  }).notNull(),

  menuItemId: varchar('menu_item_id', {
    length: 40
  }),

  itemName: varchar('item_name', {
    length: 255
  }).notNull(),

  quantity: numeric('quantity', {
    precision: 12,
    scale: 2
  }).notNull(),

  unitPrice: numeric('unit_price', {
    precision: 12,
    scale: 2
  }).notNull(),

  lineTotal: numeric('line_total', {
    precision: 12,
    scale: 2
  }).notNull(),

  notes: text('notes'),

  createdAt: timestamp('created_at').defaultNow()
});

module.exports = {
  orderItems
};