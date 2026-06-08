const pool = require('../../../config/db');
const { generateId } = require('../../../utils/generateId');

async function createCategory(
  data,
  organizationId
) {

  const duplicate =
    await pool.query(
      `
      SELECT id
      FROM outlet_categories
      WHERE organization_id = $1
      AND outlet_id = $2
      AND LOWER(name) = LOWER($3)
      `,
      [
        organizationId,
        data.outletId,
        data.name
      ]
    );

  if (duplicate.rows.length) {
    throw new Error(
      'Category already exists'
    );
  }

  const result =
    await pool.query(
      `
      INSERT INTO outlet_categories (
        id,
        organization_id,
        outlet_id,
        name,
        description,
        display_order
      )
      VALUES (
        $1,$2,$3,$4,$5,$6
      )
      RETURNING *
      `,
      [
        generateId('icat'),
        organizationId,
        data.outletId,
        data.name.trim(),
        data.description || null,
        data.displayOrder || 0
      ]
    );

  return result.rows[0];
}

async function listCategories(
  outletId,
  organizationId
) {

  const result =
    await pool.query(
      `
      SELECT *
      FROM outlet_categories
      WHERE organization_id = $1
      AND outlet_id = $2
      AND is_active = true
      ORDER BY display_order ASC,
               name ASC
      `,
      [
        organizationId,
        outletId
      ]
    );

  return result.rows;
}

async function updateCategory(
  id,
  data,
  organizationId
) {

  const result =
    await pool.query(
      `
      UPDATE outlet_categories
      SET
        name = COALESCE($1, name),
        description = COALESCE($2, description),
        display_order = COALESCE($3, display_order),
        is_active = COALESCE($4, is_active),
        updated_at = NOW()
      WHERE id = $5
      AND organization_id = $6
      RETURNING *
      `,
      [
        data.name,
        data.description,
        data.displayOrder,
        data.isActive,
        id,
        organizationId
      ]
    );

  if (!result.rows.length) {
    throw new Error(
      'Category not found'
    );
  }

  return result.rows[0];
}

async function deactivateCategory(
  id,
  organizationId
) {

  const itemCheck =
    await pool.query(
      `
      SELECT COUNT(*) AS total
      FROM outlet_item_categories
      WHERE category_id = $1
      `,
      [id]
    );

  if (
    Number(
      itemCheck.rows[0].total
    ) > 0
  ) {
    throw new Error(
      'Category contains items'
    );
  }

  const result =
    await pool.query(
      `
      UPDATE outlet_categories
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
      'Category not found'
    );
  }

  return result.rows[0];
}

module.exports = {
  createCategory,
  listCategories,
  updateCategory,
  deactivateCategory
};