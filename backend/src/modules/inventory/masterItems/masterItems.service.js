const pool = require('../../../config/db');
const { generateId } = require('../../../utils/generateId');

function normalizeName(name) {
  return name
    .trim()
    .toLowerCase();
}

async function createMasterItem(
  data,
  organizationId
) {

  const normalizedName =
    normalizeName(data.name);

  const duplicate =
    await pool.query(
      `
      SELECT id
      FROM master_items
      WHERE organization_id = $1
      AND normalized_name = $2
      `,
      [
        organizationId,
        normalizedName
      ]
    );

  if (duplicate.rows.length) {
    throw new Error(
      'Master item already exists'
    );
  }

  const unitCheck =
    await pool.query(
      `
      SELECT id
      FROM units
      WHERE id = $1
      AND organization_id = $2
      AND is_active = true
      `,
      [
        data.primaryUnitId,
        organizationId
      ]
    );

  if (!unitCheck.rows.length) {
    throw new Error(
      'Invalid unit selected'
    );
  }

  if (data.defaultVendorId) {

    const vendorCheck =
      await pool.query(
        `
        SELECT id
        FROM vendors
        WHERE id = $1
        AND organization_id = $2
        AND is_active = true
        `,
        [
          data.defaultVendorId,
          organizationId
        ]
      );

    if (!vendorCheck.rows.length) {
      throw new Error(
        'Invalid vendor selected'
      );
    }
  }

  const result =
    await pool.query(
      `
      INSERT INTO master_items (
        id,
        organization_id,
        item_code,
        name,
        normalized_name,
        description,
        item_type,
        primary_unit_id,
        default_vendor_id
      )
      VALUES (
        $1,$2,$3,$4,$5,
        $6,$7,$8,$9
      )
      RETURNING *
      `,
      [
        generateId('mit'),
        organizationId,
        data.itemCode || null,
        data.name.trim(),
        normalizedName,
        data.description || null,
        data.itemType,
        data.primaryUnitId,
        data.defaultVendorId || null
      ]
    );

  return result.rows[0];
}

async function listMasterItems(
  organizationId
) {

  const result =
    await pool.query(
      `
      SELECT
        mi.*,

        u.name AS unit_name,
        u.symbol AS unit_symbol,

        v.name AS vendor_name

      FROM master_items mi

      LEFT JOIN units u
      ON mi.primary_unit_id = u.id

      LEFT JOIN vendors v
      ON mi.default_vendor_id = v.id

      WHERE mi.organization_id = $1
      AND mi.is_active = true

      ORDER BY mi.name ASC
      `,
      [organizationId]
    );

  return result.rows;
}

async function updateMasterItem(
  id,
  data,
  organizationId
) {

  const result =
    await pool.query(
      `
      UPDATE master_items
      SET
        item_code = COALESCE($1, item_code),
        description = COALESCE($2, description),
        item_type = COALESCE($3, item_type),
        primary_unit_id = COALESCE($4, primary_unit_id),
        default_vendor_id = COALESCE($5, default_vendor_id),
        is_active = COALESCE($6, is_active),
        updated_at = NOW()
      WHERE id = $7
      AND organization_id = $8
      RETURNING *
      `,
      [
        data.itemCode,
        data.description,
        data.itemType,
        data.primaryUnitId,
        data.defaultVendorId,
        data.isActive,
        id,
        organizationId
      ]
    );

  if (!result.rows.length) {
    throw new Error(
      'Master item not found'
    );
  }

  return result.rows[0];
}

async function deactivateMasterItem(
  id,
  organizationId
) {

  const result =
    await pool.query(
      `
      UPDATE master_items
      SET
        is_active = false,
        updated_at = NOW()
      WHERE id = $1
      AND organization_id = $2
      RETURNING *
      `,
      [
        id,
        organizationId
      ]
    );

  if (!result.rows.length) {
    throw new Error(
      'Master item not found'
    );
  }

  return result.rows[0];
}

module.exports = {
  createMasterItem,
  listMasterItems,
  updateMasterItem,
  deactivateMasterItem
};