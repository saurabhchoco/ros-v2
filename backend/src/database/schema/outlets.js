const {
  pgTable,
  varchar,
  timestamp
} = require('drizzle-orm/pg-core');

const outlets = pgTable('outlets', {
  id: varchar('id', { length: 40 }).primaryKey(),

  organizationId: varchar('organization_id', {
    length: 40
  }).notNull(),

  name: varchar('name', {
    length: 255
  }).notNull(),

  outletType: varchar('outlet_type', {
    length: 50
  }).notNull(),

  status: varchar('status', {
    length: 50
  }).default('ACTIVE'),

  createdAt: timestamp('created_at').defaultNow(),

  updatedAt: timestamp('updated_at').defaultNow()
});

module.exports = {
  outlets
};