const {
    pgTable,
    varchar,
    boolean,
    timestamp,
    unique
} = require('drizzle-orm/pg-core');

const vendors = pgTable('vendors', {
    id: varchar('id', { length: 40 }).primaryKey(),

    organizationId: varchar(
        'organization_id',
        { length: 40 }
    ).notNull(),

    vendorCode: varchar(
        'vendor_code',
        { length: 100 }
    ),

    name: varchar('name', {
        length: 255
    }).notNull(),

    contactPerson: varchar(
        'contact_person',
        { length: 255 }
    ),

    phone: varchar('phone', {
        length: 50
    }),

    email: varchar('email', {
        length: 255
    }),

    gstNumber: varchar(
        'gst_number',
        { length: 100 }
    ),

    address: varchar(
        'address',
        { length: 1000 }
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
        uniqueVendorName: unique(
            'uq_vendors_org_name'
        ).on(
            table.organizationId,
            table.name
        )
    })
);

module.exports = {
    vendors
};