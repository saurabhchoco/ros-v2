const {
  pgTable,
  varchar,
  timestamp
} = require('drizzle-orm/pg-core');

const users = pgTable('users', {

  id: varchar('id', {
    length: 40
  }).primaryKey(),

  firebaseUid: varchar('firebase_uid', {
    length: 255
  }).notNull(),

  organizationId: varchar('organization_id', {
    length: 40
  }).notNull(),

  outletId: varchar('outlet_id', {
    length: 40
  }),

  fullName: varchar('full_name', {
    length: 255
  }).notNull(),

  email: varchar('email', {
    length: 255
  }).notNull(),

  role: varchar('role', {
    length: 50
  }).notNull(),

  status: varchar('status', {
    length: 50
  }).default('ACTIVE'),

  createdAt: timestamp('created_at').defaultNow(),

  updatedAt: timestamp('updated_at').defaultNow()
});

module.exports = {
  users
};