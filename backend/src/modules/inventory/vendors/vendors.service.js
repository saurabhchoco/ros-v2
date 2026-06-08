const pool = require('../../../config/db');
const { generateId } = require('../../../utils/generateId');

async function createVendor(data, organizationId) {

  const existing = await pool.query(
    `
    SELECT id
    FROM vendors
    WHERE organization_id = $1
    AND LOWER(name) = LOWER($2)
    `,
    [
      organizationId,
      data.name
    ]
  );

  if (existing.rows.length) {
    throw new Error('Vendor already exists');
  }

  const result = await pool.query(
    `
    INSERT INTO vendors (
      id,
      organization_id,
      name,
      contact_person,
      phone,
      email,
      gst_number,
      address
    )
    VALUES (
      $1,$2,$3,$4,$5,$6,$7,$8
    )
    RETURNING *
    `,
    [
      generateId('vnd'),
      organizationId,
      data.name.trim(),
      data.contactPerson || null,
      data.phone || null,
      data.email || null,
      data.gstNumber || null,
      data.address || null
    ]
  );

  return result.rows[0];
}

async function listVendors(organizationId) {

  const result = await pool.query(
    `
    SELECT *
    FROM vendors
    WHERE organization_id = $1
    AND is_active = true
    ORDER BY name ASC
    `,
    [organizationId]
  );

  return result.rows;
}

async function updateVendor(
  id,
  data,
  organizationId
) {

  const result = await pool.query(
    `
    UPDATE vendors
    SET
      name = COALESCE($1, name),
      contact_person = COALESCE($2, contact_person),
      phone = COALESCE($3, phone),
      email = COALESCE($4, email),
      gst_number = COALESCE($5, gst_number),
      address = COALESCE($6, address),
      is_active = COALESCE($7, is_active),
      updated_at = NOW()
    WHERE id = $8
    AND organization_id = $9
    RETURNING *
    `,
    [
      data.name,
      data.contactPerson,
      data.phone,
      data.email,
      data.gstNumber,
      data.address,
      data.isActive,
      id,
      organizationId
    ]
  );

  if (!result.rows.length) {
    throw new Error('Vendor not found');
  }

  return result.rows[0];
}

async function deactivateVendor(
  id,
  organizationId
) {

  const result = await pool.query(
    `
    UPDATE vendors
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
    throw new Error('Vendor not found');
  }

  return result.rows[0];
}

module.exports = {
  createVendor,
  listVendors,
  updateVendor,
  deactivateVendor
};