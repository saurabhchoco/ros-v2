const {
  pgTable,
  varchar,
  numeric,
  timestamp
} = require('drizzle-orm/pg-core');

const orders = pgTable('orders', {

  id: varchar('id', {
    length: 40
  }).primaryKey(),

  organizationId: varchar('organization_id', {
    length: 40
  }).notNull(),

  outletId: varchar('outlet_id', {
    length: 40
  }).notNull(),

  orderNo: varchar('order_no', {
    length: 100
  }).notNull(),

  orderSource: varchar('order_source', {
    length: 50
  }).notNull(),

  orderStatus: varchar('order_status', {
    length: 50
  }).notNull(),

  customerName: varchar('customer_name', {
    length: 255
  }),

  customerMobile: varchar('customer_mobile', {
    length: 20
  }),

  subtotal: numeric('subtotal', {
    precision: 12,
    scale: 2
  }).notNull(),

  taxAmount: numeric('tax_amount', {
    precision: 12,
    scale: 2
  }).notNull(),

  discountAmount: numeric('discount_amount', {
    precision: 12,
    scale: 2
  }).default('0'),

  grandTotal: numeric('grand_total', {
    precision: 12,
    scale: 2
  }).notNull(),

  paymentStatus: varchar('payment_status', {
    length: 50
  }).default('PENDING'),

  createdBy: varchar('created_by', {
    length: 40
  }),

  createdAt: timestamp('created_at').defaultNow(),

  updatedAt: timestamp('updated_at').defaultNow()
});

module.exports = {
  orders
};