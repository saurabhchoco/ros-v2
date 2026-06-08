const pool = require('../../../config/db');
const { generateId } = require('../../../utils/generateId');

async function createUnit(data, organizationId) {

    if (data.isBaseUnit) {
        await pool.query(
            `
      UPDATE units
      SET is_base_unit = false
      WHERE organization_id = $1
      AND unit_type = $2
      `,
            [organizationId, data.unitType]
        );
    }

    const result = await pool.query(
        `
    INSERT INTO units (
      id,
      organization_id,
      name,
      symbol,
      unit_type,
      is_base_unit
    )
    VALUES ($1,$2,$3,$4,$5,$6)
    RETURNING *
    `,
        [
            generateId('unt'),
            organizationId,
            data.name.trim(),
            data.symbol.trim(),
            data.unitType,
            data.isBaseUnit || false
        ]
    );

    return result.rows[0];
}

async function listUnits(organizationId) {
    const result = await pool.query(
        `
    SELECT *
    FROM units
    WHERE organization_id = $1
    ORDER BY unit_type, name
    `,
        [organizationId]
    );

    return result.rows;
}

async function updateUnit(id, data, organizationId) {
  // Check for duplicate name or symbol excluding current record
  const existing = await pool.query(
    `SELECT id
     FROM units
     WHERE organization_id = $1
     AND ( LOWER(name) = LOWER($2) OR LOWER(symbol) = LOWER($3) )
     AND id <> $4`,
    [organizationId, data.name, data.symbol, id]
  );

  if (existing.rows.length) {
    throw new Error('Unit name or symbol already exists');
  }

  // If setting this unit as base, unset others in same unit_type
  if (data.isBaseUnit === true) {
    // Get current unit's type (or from request)
    let unitType = data.unitType;
    if (!unitType) {
      const current = await pool.query(`SELECT unit_type FROM units WHERE id = $1`, [id]);
      unitType = current.rows[0]?.unit_type;
    }
    if (unitType) {
      await pool.query(
        `UPDATE units
         SET is_base_unit = false
         WHERE organization_id = $1
         AND unit_type = $2
         AND id <> $3`,
        [organizationId, unitType, id]
      );
    }
  }

  const result = await pool.query(
    `UPDATE units
     SET
       name = COALESCE($1, name),
       symbol = COALESCE($2, symbol),
       unit_type = COALESCE($3, unit_type),
       is_base_unit = COALESCE($4, is_base_unit),
       is_active = COALESCE($5, is_active),
       updated_at = NOW()
     WHERE id = $6
     AND organization_id = $7
     RETURNING *`,
    [
      data.name,
      data.symbol,
      data.unitType,
      data.isBaseUnit,
      data.isActive,
      id,
      organizationId
    ]
  );

  if (!result.rows.length) {
    throw new Error('Unit not found');
  }

  return result.rows[0];
}

async function deactivateUnit(id, organizationId) {

    const result = await pool.query(
        `
    UPDATE units
    SET
      is_active = false,
      updated_at = NOW()
    WHERE id = $1
    AND organization_id = $2
    RETURNING *
    `,
        [id, organizationId]
    );

    if (!result.rows.length) {
        throw new Error('Unit not found');
    }

    return result.rows[0];
}

module.exports = {
    createUnit,
    listUnits,
    updateUnit,
    deactivateUnit
};