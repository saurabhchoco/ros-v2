const pool =
  require('../../config/db');

const generateId =
  require('../../utils/generateId');

async function createCategory(
  data
) {

  const id =
    generateId('cat');

  const result =
    await pool.query(

      `
      INSERT INTO menu_categories (
        id,
        organization_id,
        outlet_id,
        name,
        description
      )
      VALUES (
        $1,$2,$3,$4,$5
      )
      RETURNING *
      `,
      [
        id,
        data.organizationId,
        data.outletId,
        data.name,
        data.description || null
      ]

    );

  return result.rows[0];
}

async function listCategories(
  organizationId,
  outletId
) {

  const result =
    await pool.query(

      `
      SELECT *
      FROM menu_categories
      WHERE
        organization_id = $1
      AND
        outlet_id = $2
      AND
        is_active = true
      ORDER BY created_at DESC
      `,

      [
        organizationId,
        outletId
      ]

    );

  return result.rows;
}

async function createMenuItem(
  data
) {

  const id =
    generateId('mnu');

  const result =
    await pool.query(

      `
      INSERT INTO menu_items (
        id,
        organization_id,
        outlet_id,
        category_id,
        item_code,
        name,
        description,
        base_price,
        tax_percentage,
        is_veg
      )
      VALUES (
        $1,$2,$3,$4,$5,
        $6,$7,$8,$9,$10
      )
      RETURNING *
      `,
      [
        id,
        data.organizationId,
        data.outletId,
        data.categoryId,
        data.itemCode || null,
        data.name,
        data.description || null,
        data.basePrice,
        data.taxPercentage || 0,
        data.isVeg || false
      ]

    );

  return result.rows[0];
}

async function listMenuItems(
  organizationId,
  outletId
) {

  const result =
    await pool.query(

      `
      SELECT *
      FROM menu_items
      WHERE
        organization_id = $1
      AND
        outlet_id = $2
      AND
        is_available = true
      ORDER BY created_at DESC
      `,

      [
        organizationId,
        outletId
      ]

    );

  return result.rows;
}

module.exports = {
  createCategory,
  listCategories,
  createMenuItem,
  listMenuItems
};