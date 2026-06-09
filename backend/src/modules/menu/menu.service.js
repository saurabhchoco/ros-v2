const pool =
  require('../../config/db');

const {
  generateId
} = require('../../utils/generateId');

const fs =
  require('fs');

const csv =
  require('csv-parser');

const crypto = require('crypto');

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

// listMenuItems – no is_deleted, handles categoryId='all'
async function listMenuItems(organizationId, outletId, categoryId = null) {
  let query = `
    SELECT mi.*, mc.name as category_name
    FROM menu_items mi
    LEFT JOIN menu_categories mc ON mi.category_id = mc.id
    WHERE mi.organization_id = $1 AND mi.outlet_id = $2
  `;
  const params = [organizationId, outletId];
  
  // Only filter by category if a specific ID is provided (not 'all')
  if (categoryId && categoryId !== 'all') {
    query += ` AND mi.category_id = $3`;
    params.push(categoryId);
  }
  
  query += ` ORDER BY mi.name ASC`;
  const result = await pool.query(query, params);
  return result.rows;
}

// createMenuItem – map camelCase frontend fields to snake_case columns
async function createMenuItem(data, userContext) {
  const {
    name, basePrice, description, isVeg, taxPercentage, isAvailable,
    categoryId, organizationId, outletId, itemCode, status
  } = data;
  const id = generateId('itm');
  const query = `
    INSERT INTO menu_items (
      id, name, base_price, description, is_veg, tax_percentage,
      is_available, category_id, organization_id, outlet_id,
      item_code, status, item_type
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    RETURNING *
  `;
  const values = [
    id, name, basePrice, description, isVeg, taxPercentage || 0,
    isAvailable !== undefined ? isAvailable : true,
    categoryId, organizationId, outletId,
    itemCode || null, status || 'active', 'SIMPLE'
  ];
  const result = await pool.query(query, values);
  return result.rows[0];
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
  const { name, basePrice, description, isVeg, taxPercentage, isAvailable, status } = updates;
  const result = await pool.query(`
    UPDATE menu_items 
    SET name = COALESCE($1, name),
        base_price = COALESCE($2, base_price),
        description = COALESCE($3, description),
        is_veg = COALESCE($4, is_veg),
        tax_percentage = COALESCE($5, tax_percentage),
        is_available = COALESCE($6, is_available),
        status = COALESCE($7, status),
        updated_at = NOW()
    WHERE id = $8
    RETURNING *
  `, [name, basePrice, description, isVeg, taxPercentage, isAvailable, status, id]);
  if (!result.rows.length) throw new Error('Item not found');
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

/**
 * Get item counts per category for a given outlet
 * @param {string} outletId
 * @returns {Promise<Object>} object mapping category_id -> count
 */
async function getCategoryItemCounts(outletId) {
  const result = await pool.query(
    `SELECT category_id, COUNT(*) as count
     FROM menu_items
     WHERE outlet_id = $1
     GROUP BY category_id`,
    [outletId]
  );
  const counts = {};
  result.rows.forEach(row => {
    counts[row.category_id] = parseInt(row.count);
  });
  return counts;
}

async function batchUpdateItems(itemIds, action, userContext) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    let updated = 0;
    for (const id of itemIds) {
      if (action.type === 'price') {
        const { rows } = await client.query('SELECT base_price FROM menu_items WHERE id = $1', [id]);
        if (!rows.length) continue;
        let newPrice = parseFloat(rows[0].base_price);
        if (action.isPercent) {
          newPrice = newPrice * (1 + action.value / 100);
        } else {
          newPrice += action.value;
        }
        newPrice = Math.max(0, newPrice);
        await client.query('UPDATE menu_items SET base_price = $1 WHERE id = $2', [newPrice, id]);
        updated++;
      } else if (action.type === 'status') {
        const validStatus = ['active', 'draft', 'out_of_stock', 'hidden'];
        if (!validStatus.includes(action.value)) throw new Error('Invalid status');
        await client.query('UPDATE menu_items SET status = $1 WHERE id = $2', [action.value, id]);
        updated++;
      } else if (action.type === 'category') {
        await client.query('UPDATE menu_items SET category_id = $1 WHERE id = $2', [action.value, id]);
        updated++;
      }
    }
    await client.query('COMMIT');
    return { updated };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function duplicateMenuItem(id, userContext) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // Fetch original item
    const itemRes = await client.query('SELECT * FROM menu_items WHERE id = $1', [id]);
    if (!itemRes.rows.length) throw new Error('Item not found');
    const original = itemRes.rows[0];

    // Generate new unique ID
    const newId = generateMenuItemId();

    // Generate new item_code if it exists
    let newItemCode = original.item_code ? `${original.item_code}_copy` : null;

    // Insert with explicitly generated ID
    const insertRes = await client.query(`
      INSERT INTO menu_items (
        id, name, description, base_price, is_veg, tax_percentage, status,
        item_type, organization_id, outlet_id, category_id, item_code, is_available
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `, [
      newId,
      `${original.name} (Copy)`,
      original.description,
      original.base_price,
      original.is_veg,
      original.tax_percentage,
      original.status,
      original.item_type,
      original.organization_id,
      original.outlet_id,
      original.category_id,
      newItemCode,
      original.is_available
    ]);

    // (Optional) Copy variants if the table exists – skip for now to keep simple
    // You can add later

    await client.query('COMMIT');
    return insertRes.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

function generateMenuItemId() {
  // Generate a random 10-character string (e.g., 'itm_a1b2c3d4e5')
  const random = crypto.randomBytes(5).toString('hex'); // 10 hex chars
  return `itm_${random}`;
}



// Helper to get or create a category by name (reused from import)
async function getOrCreateCategory(categoryName, outletId, organizationId, client) {
  if (!categoryName) return null;
  let res = await client.query(
    `SELECT id FROM menu_categories WHERE name = $1 AND outlet_id = $2 AND organization_id = $3`,
    [categoryName, outletId, organizationId]
  );
  if (res.rows.length > 0) return res.rows[0].id;
  const newId = `cat_${crypto.randomBytes(5).toString('hex')}`;
  const orderRes = await client.query(
    `SELECT COALESCE(MAX(display_order), 0) + 1 as next_order FROM menu_categories WHERE outlet_id = $1`,
    [outletId]
  );
  await client.query(
    `INSERT INTO menu_categories (id, name, outlet_id, organization_id, display_order)
     VALUES ($1, $2, $3, $4, $5)`,
    [newId, categoryName, outletId, organizationId, orderRes.rows[0].next_order]
  );
  return newId;
}

async function copyMenuToOutlet(sourceOutletId, targetOutletId, userContext) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Clear existing menu in target outlet
    await client.query('DELETE FROM menu_items WHERE outlet_id = $1', [targetOutletId]);
    await client.query('DELETE FROM menu_categories WHERE outlet_id = $1', [targetOutletId]);

    // 2. Copy all categories from source to target (by name, generate new IDs)
    const sourceCategories = await client.query(
      'SELECT name, display_order FROM menu_categories WHERE outlet_id = $1',
      [sourceOutletId]
    );
    const categoryNameToId = {};
    for (const cat of sourceCategories.rows) {
      const newId = `cat_${crypto.randomBytes(5).toString('hex')}`;
      await client.query(
        `INSERT INTO menu_categories (id, name, outlet_id, organization_id, display_order)
         VALUES ($1, $2, $3, $4, $5)`,
        [newId, cat.name, targetOutletId, userContext.organization_id, cat.display_order]
      );
      categoryNameToId[cat.name] = newId;
    }
    console.log(`Copied ${sourceCategories.rows.length} categories.`);

    // Ensure "Uncategorized" exists in target (will be used for orphaned items)
    if (!categoryNameToId['Uncategorized']) {
      const uncatId = `cat_${crypto.randomBytes(5).toString('hex')}`;
      const maxOrder = await client.query(
        `SELECT COALESCE(MAX(display_order), 0) + 1 as next FROM menu_categories WHERE outlet_id = $1`,
        [targetOutletId]
      );
      await client.query(
        `INSERT INTO menu_categories (id, name, outlet_id, organization_id, display_order)
         VALUES ($1, $2, $3, $4, $5)`,
        [uncatId, 'Uncategorized', targetOutletId, userContext.organization_id, maxOrder.rows[0].next]
      );
      categoryNameToId['Uncategorized'] = uncatId;
      console.log('Added "Uncategorized" category to target.');
    }

    // 3. Copy all items from source to target
    // We need source item ID for variants, so SELECT mi.id as well
    const sourceItems = await client.query(
      `SELECT mi.id, mi.name, mi.description, mi.base_price, mi.is_veg, mi.tax_percentage,
              mi.status, mi.item_type, mi.item_code, mi.is_available, mc.name as category_name
       FROM menu_items mi
       LEFT JOIN menu_categories mc ON mi.category_id = mc.id AND mc.outlet_id = $1
       WHERE mi.outlet_id = $1`,
      [sourceOutletId]
    );
    let inserted = 0;
    for (const item of sourceItems.rows) {
      let categoryName = item.category_name;
      if (!categoryName) {
        console.log(`Item "${item.name}" has no category → using "Uncategorized"`);
        categoryName = 'Uncategorized';
      }
      let targetCategoryId = categoryNameToId[categoryName];
      if (!targetCategoryId) {
        // Create missing category in target (should not happen, but safe)
        const newId = `cat_${crypto.randomBytes(5).toString('hex')}`;
        const maxOrder = await client.query(
          `SELECT COALESCE(MAX(display_order), 0) + 1 as next FROM menu_categories WHERE outlet_id = $1`,
          [targetOutletId]
        );
        await client.query(
          `INSERT INTO menu_categories (id, name, outlet_id, organization_id, display_order)
           VALUES ($1, $2, $3, $4, $5)`,
          [newId, categoryName, targetOutletId, userContext.organization_id, maxOrder.rows[0].next]
        );
        targetCategoryId = newId;
        categoryNameToId[categoryName] = targetCategoryId;
        console.log(`Created missing category "${categoryName}" in target.`);
      }
      const newItemId = `itm_${crypto.randomBytes(5).toString('hex')}`;
      await client.query(
        `INSERT INTO menu_items (
          id, name, description, base_price, is_veg, tax_percentage, status,
          item_type, organization_id, outlet_id, category_id, item_code, is_available
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
        [
          newItemId, item.name, item.description, item.base_price, item.is_veg,
          item.tax_percentage, item.status, item.item_type,
          userContext.organization_id, targetOutletId, targetCategoryId,
          item.item_code, item.is_available
        ]
      );
      inserted++;

      // 4. Copy variants (if any) – using original source item.id
      try {
        const variants = await client.query(
          'SELECT name, price, is_default FROM menu_item_variants WHERE menu_item_id = $1',
          [item.id]
        );
        for (const variant of variants.rows) {
          await client.query(
            `INSERT INTO menu_item_variants (menu_item_id, name, price, is_default)
             VALUES ($1, $2, $3, $4)`,
            [newItemId, variant.name, variant.price, variant.is_default]
          );
        }
      } catch (err) {
        // variants table might not exist – log and continue
        if (err.code !== '42P01') console.warn('Variants copy error:', err.message);
      }
    }
    console.log(`Copied ${inserted} out of ${sourceItems.rows.length} items.`);

    await client.query('COMMIT');
    return { success: true, message: `Copied ${sourceCategories.rows.length} categories, ${inserted} items` };
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Copy menu error:', err);
    throw new Error(`Copy failed: ${err.message}`);
  } finally {
    client.release();
  }
}

async function updateCategory(id, newName, userContext) {
  const result = await pool.query(
    `UPDATE menu_categories SET name = $1, updated_at = NOW()
     WHERE id = $2 AND organization_id = $3
     RETURNING *`,
    [newName, id, userContext.organization_id]
  );
  if (result.rows.length === 0) throw new Error('Category not found');
  return result.rows[0];
}

async function deleteCategory(id, moveToCategoryId, userContext) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // Check if category has items
    const itemsCount = await client.query(
      `SELECT COUNT(*) FROM menu_items WHERE category_id = $1 AND outlet_id IN
       (SELECT id FROM outlets WHERE organization_id = $2)`,
      [id, userContext.organization_id]
    );
    if (parseInt(itemsCount.rows[0].count) > 0 && !moveToCategoryId) {
      throw new Error('Cannot delete category with items. Move items first.');
    }
    if (moveToCategoryId) {
      // Move items to target category
      await client.query(
        `UPDATE menu_items SET category_id = $1 WHERE category_id = $2`,
        [moveToCategoryId, id]
      );
    }
    // Delete category
    await client.query(
      `DELETE FROM menu_categories WHERE id = $1 AND organization_id = $2`,
      [id, userContext.organization_id]
    );
    await client.query('COMMIT');
    return { success: true, message: 'Category deleted' };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function mergeCategories(sourceId, targetId, userContext) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // Move all items from source to target
    await client.query(
      `UPDATE menu_items SET category_id = $1 WHERE category_id = $2`,
      [targetId, sourceId]
    );
    // Delete source category
    await client.query(
      `DELETE FROM menu_categories WHERE id = $1 AND organization_id = $2`,
      [sourceId, userContext.organization_id]
    );
    await client.query('COMMIT');
    return { success: true, message: 'Categories merged' };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = {
  createCategory,
  listCategories,
  createMenuItem,
  listMenuItems,
  importMenuCSV,
  updateMenuItem,
  deleteMenuItem,
  createCombo,
  getCategoryItemCounts,
  batchUpdateItems,
  duplicateMenuItem,
  getOrCreateCategory,
  copyMenuToOutlet,
  mergeCategories,
  deleteCategory,
  updateCategory
};