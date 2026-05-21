const pool =
  require('../../config/db');

const {
  generateId
} = require('../../utils/generateId');

const fs =
  require('fs');

const csv =
  require('csv-parser');

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
      ORDER BY display_order ASC, name ASC
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
  outletId,
  categoryId = null
) {
  let query = `
    SELECT *
    FROM menu_items
    WHERE
      organization_id = $1
    AND
      outlet_id = $2
    AND
      is_available = true
  `;

  const params = [organizationId, outletId];

  if (categoryId) {
    query += ` AND category_id = $3`;
    params.push(categoryId);
  }

  query += ` ORDER BY name ASC`;

  const result = await pool.query(
    query,
    params
  );
  return result.rows;
}

async function importMenuCSV(
  filePath,
  organizationId,
  outletId
) {

  return new Promise(
    (resolve, reject) => {

      const results = [];

      fs.createReadStream(filePath)

        .pipe(csv())

        .on('data', row => {
          results.push(row);
        })

        .on('end', async () => {

          const summary = {
            total: results.length,
            imported: 0,
            skipped: 0,
            skippedRows: []
          };

          try {

            for (const [index, row] of results.entries()) {

              // Validate required fields
              if (
                !row.name ||
                !row.base_price ||
                !row.category_name
              ) {
                summary.skipped++;
                summary.skippedRows.push({
                  row: index + 1,
                  reason: 'Missing required field (name, base_price, or category_name)',
                  data: row
                });
                continue;
              }

              // Validate price is a number
              const price = Number(row.base_price);
              if (isNaN(price) || price < 0) {
                summary.skipped++;
                summary.skippedRows.push({
                  row: index + 1,
                  reason: `Invalid base_price: "${row.base_price}"`,
                  data: row
                });
                continue;
              }

              // Tenant-scoped category lookup
                const categoryName = row.category_name ? row.category_name.trim() : '';

                const categoryResult = await pool.query(
                  `
                  SELECT id
                  FROM menu_categories
                  WHERE LOWER(name) = LOWER($1)
                  AND organization_id = $2
                  AND outlet_id = $3
                  LIMIT 1
                  `,
                  [categoryName, organizationId, outletId]
                );

                let categoryId;

                if (!categoryResult.rows[0]) {

                  const newCategory = await pool.query(
                    `
                    INSERT INTO menu_categories (
                      id, organization_id, outlet_id, name, created_at, updated_at
                    )
                    VALUES ($1,$2,$3,$4,NOW(),NOW())
                    RETURNING id
                    `,
                    [generateId('cat'), organizationId, outletId, categoryName]
                  );

                  categoryId =
                    newCategory.rows[0].id;

                } else {

                  categoryId =
                    categoryResult.rows[0].id;

                }

              // const categoryId =
              //   categoryResult.rows[0].id;

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
                  is_veg,
                  is_available,
                  created_at,
                  updated_at
                )
                VALUES (
                  $1,$2,$3,$4,$5,
                  $6,$7,$8,$9,$10,
                  true,NOW(),NOW()
                )
                `,
                [
                  generateId('itm'),
                  organizationId,
                  outletId,
                  categoryId,
                  row.item_code || null,
                  row.name,
                  row.description || null,
                  price,
                  Number(row.tax_percentage) || 0,
                  row.is_veg === 'true'
                ]
              );

              summary.imported++;

            }

            resolve(summary);

          } catch (error) {
            reject(error);
          }

        });

    }
  );

}

async function updateMenuItem(id, updates, userContext) {
  const { name, basePrice, description, isVeg, taxPercentage, isAvailable } = updates;
  // Ensure item belongs to same organization
  const check = await pool.query(
    `SELECT id FROM menu_items WHERE id = $1 AND organization_id = $2`,
    [id, userContext.organization_id]
  );
  if (check.rows.length === 0) {
    throw new Error('Item not found or unauthorized');
  }
  const result = await pool.query(
    `UPDATE menu_items
     SET name = COALESCE($1, name),
         base_price = COALESCE($2, base_price),
         description = COALESCE($3, description),
         is_veg = COALESCE($4, is_veg),
         tax_percentage = COALESCE($5, tax_percentage),
         is_available = COALESCE($6, is_available),
         updated_at = NOW()
     WHERE id = $7
     RETURNING *`,
    [name, basePrice, description, isVeg, taxPercentage, isAvailable, id]
  );
  return result.rows[0];
}

async function deleteMenuItem(id, userContext) {
  const result = await pool.query(
    `DELETE FROM menu_items WHERE id = $1 AND organization_id = $2 RETURNING id`,
    [id, userContext.organization_id]
  );
  if (result.rows.length === 0) {
    throw new Error('Item not found or unauthorized');
  }
  return true;
}

async function createCombo(data) {
  const id = generateId('itm');
  const result = await pool.query(
    `INSERT INTO menu_items (
      id, organization_id, outlet_id, category_id, name, base_price,
      tax_percentage, is_veg, is_available, item_type, components
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'COMBO', $10)
    RETURNING *`,
    [id, data.organizationId, data.outletId, data.categoryId, data.name,
     data.basePrice, 0, true, true, JSON.stringify(data.components)]
  );
  return result.rows[0];
}

module.exports = {
  createCategory,
  listCategories,
  createMenuItem,
  listMenuItems,
  importMenuCSV,
  updateMenuItem,
  deleteMenuItem,
  createCombo
};