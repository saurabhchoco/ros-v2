const {
    pgTable,
    varchar,
    boolean,
    timestamp,
    unique
} = require('drizzle-orm/pg-core');

const units = pgTable('units', {
    id: varchar('id', { length: 40 }).primaryKey(),

    organizationId: varchar('organization_id', {
        length: 40
    }).notNull(),

    name: varchar('name', {
        length: 100
    }).notNull(),

    symbol: varchar('symbol', {
        length: 20
    }).notNull(),

    unitType: varchar('unit_type', {
        length: 50
    }).notNull(),

    isBaseUnit: boolean('is_base_unit').default(false),

    isActive: boolean('is_active').default(true),

    createdAt: timestamp('created_at').defaultNow(),

    updatedAt: timestamp('updated_at').defaultNow(),

},
    (table) => ({
        uniqueUnitName: unique(
            'uq_units_org_name'
        ).on(
            table.organizationId,
            table.name
        ),

        uniqueUnitSymbol: unique(
            'uq_units_org_symbol'
        ).on(
            table.organizationId,
            table.symbol
        )
    })
);

module.exports = {
    units
};