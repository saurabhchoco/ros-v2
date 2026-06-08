const pool = require('../../../config/db');
const { generateId } = require('../../../utils/generateId');

async function assignItemCategory(
  data,
  organizationId
) {

  const itemCheck =
    await pool.query(
      `
      SELECT id
      FROM master_items
      WHERE id = $1
      AND organization_id = $2
      AND is_active = true
      `,
      [
        data.masterItemId,
        organizationId
      ]
    );

  if (!itemCheck.rows.length) {
    throw new Error(
      'Master item not found'
    );
  }

  const categoryCheck =
    await pool.query(
      `
      SELECT id
      FROM outlet_categories
      WHERE id = $1
      AND outlet_id = $2
      AND organization_id = $3
      AND is_active = true
      `,
      [
        data.categoryId,
        data.outletId,
        organizationId
      ]
    );

  if (!categoryCheck.rows.length) {
    throw new Error(
      'Category not found'
    );
  }

  const existing =
    await pool.query(
      `
      SELECT id
      FROM outlet_item_categories
      WHERE outlet_id = $1
      AND master_item_id = $2
      `,
      [
        data.outletId,
        data.masterItemId
      ]
    );

  if (existing.rows.length) {

    const result =
      await pool.query(
        `
        UPDATE outlet_item_categories
        SET
          category_id = $1,
          updated_at = NOW()
        WHERE id = $2
        RETURNING *
        `,
        [
          data.categoryId,
          existing.rows[0].id
        ]
      );

    return result.rows[0];
  }

  const result =
    await pool.query(
      `
      INSERT INTO outlet_item_categories (
        id,
        organization_id,
        outlet_id,
        master_item_id,
        category_id
      )
      VALUES (
        $1,$2,$3,$4,$5
      )
      RETURNING *
      `,
      [
        generateId('map'),
        organizationId,
        data.outletId,
        data.masterItemId,
        data.categoryId
      ]
    );

  return result.rows[0];
}

async function listItemCategories(
  outletId,
  organizationId
) {

  const result =
    await pool.query(
      `
      SELECT

        oic.id,

        mi.id AS master_item_id,
        mi.name AS item_name,

        oc.id AS category_id,
        oc.name AS category_name,

        oic.created_at,
        oic.updated_at

      FROM outlet_item_categories oic

      INNER JOIN master_items mi
      ON mi.id = oic.master_item_id

      INNER JOIN outlet_categories oc
      ON oc.id = oic.category_id

      WHERE oic.organization_id = $1
      AND oic.outlet_id = $2

      ORDER BY mi.name ASC
      `,
      [
        organizationId,
        outletId
      ]
    );

  return result.rows;
}

async function removeItemCategory(
  id,
  organizationId
) {

  const result =
    await pool.query(
      `
      DELETE
      FROM outlet_item_categories
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
      'Mapping not found'
    );
  }

  return result.rows[0];
}

module.exports = {
  assignItemCategory,
  listItemCategories,
  removeItemCategory
};