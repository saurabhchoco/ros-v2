const {
  pgTable,
  varchar,
  text,
  timestamp,
  json
} = require('drizzle-orm/pg-core');

const auditLogs = pgTable('audit_logs', {

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
  ),

  userId: varchar(
    'user_id',
    {
      length: 40
    }
  ),

  action: varchar(
    'action',
    {
      length: 100
    }
  ).notNull(),

  entityType: varchar(
    'entity_type',
    {
      length: 100
    }
  ).notNull(),

  entityId: varchar(
    'entity_id',
    {
      length: 40
    }
  ).notNull(),

  oldValue: json('old_value'),

  newValue: json('new_value'),

  createdAt: timestamp(
    'created_at'
  ).defaultNow()

});

module.exports = {
  auditLogs
};