const { pgTable, varchar, timestamp } = require('drizzle-orm/pg-core');

const organizations = pgTable('organizations', {
  id: varchar('id', { length: 40 }).primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  status: varchar('status', { length: 50 }).default('ACTIVE'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

module.exports = {
  organizations
};