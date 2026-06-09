const pool = require('../config/db');
const crypto = require('crypto');

// Helper: get or create a category by name (outlet‑specific)
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

async function dryRunImport(validRows, outletId, organizationId) {
  let toCreateCount = 0;
  let toUpdateCount = 0;
  const categoriesToCreate = new Set();
  const warnings = [];
  const errors = [];

  for (const row of validRows) {
    // Check if item exists in target outlet
    const existing = await pool.query(
      `SELECT id FROM menu_items WHERE id = $1 AND outlet_id = $2`,
      [row.id, outletId]
    );
    if (existing.rows.length === 0) {
      toCreateCount++;
    } else {
      toUpdateCount++;
    }

    // Check category existence
    const catExists = await pool.query(
      `SELECT id FROM menu_categories WHERE name = $1 AND outlet_id = $2`,
      [row.category, outletId]
    );
    if (catExists.rows.length === 0) {
      categoriesToCreate.add(row.category);
    }
  }

  if (categoriesToCreate.size > 0) {
    warnings.push(`Categories to be created: ${Array.from(categoriesToCreate).join(', ')}`);
  }
  if (toCreateCount > 0) {
    warnings.push(`${toCreateCount} new item(s) will be created.`);
  }

  return { toCreateCount, toUpdateCount, warnings, errors };
}

// Main import function with per‑row savepoints and type conversion
async function importMenu(validRows, outletId, organizationId) {
  const client = await pool.connect();
  let created = 0, updated = 0, errors = 0;
  try {
    await client.query('BEGIN');
    for (const row of validRows) {
      await client.query('SAVEPOINT row_savepoint');
      try {
        // Get or create category
        let categoryId = null;
        if (row.category) {
          categoryId = await getOrCreateCategory(row.category, outletId, organizationId, client);
        }
        // Convert types – remove ₹ etc.
        const itemId = row.id;
        const name = row.name?.trim();
        if (!name) throw new Error('Missing name');
        const priceStr = String(row.base_price).replace(/[^0-9.-]/g, '');
        const basePrice = parseFloat(priceStr);
        if (isNaN(basePrice)) throw new Error(`Invalid price: ${row.base_price}`);
        const description = row.description || null;
        const isVeg = row.is_veg === '1' || row.is_veg === 'true';
        const taxPercentage = parseFloat(row.tax_percentage) || 0;
        const status = ['active','draft','out_of_stock','hidden'].includes(row.status) ? row.status : 'active';
        const isAvailable = row.is_available === '1' || row.is_available === 'true';
        const itemCode = row.item_code || null;

        // Check existing
        const existing = await client.query(
          `SELECT id FROM menu_items WHERE id = $1 AND outlet_id = $2`,
          [itemId, outletId]
        );
        if (existing.rows.length) {
          await client.query(
            `UPDATE menu_items SET
              name = $1,
              base_price = $2,
              description = $3,
              is_veg = $4,
              tax_percentage = $5,
              status = $6,
              is_available = $7,
              category_id = $8,
              item_code = $9,
              updated_at = NOW()
             WHERE id = $10 AND outlet_id = $11`,
            [name, basePrice, description, isVeg, taxPercentage, status, isAvailable, categoryId, itemCode, itemId, outletId]
          );
          updated++;
        } else {
          let finalId = itemId;
          const idCheck = await client.query(`SELECT 1 FROM menu_items WHERE id = $1`, [itemId]);
          if (idCheck.rows.length) finalId = `itm_${crypto.randomBytes(5).toString('hex')}`;
          await client.query(
            `INSERT INTO menu_items (
              id, name, base_price, description, is_veg, tax_percentage,
              status, item_type, organization_id, outlet_id, category_id,
              item_code, is_available
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
            [finalId, name, basePrice, description, isVeg, taxPercentage,
             status, 'SIMPLE', organizationId, outletId, categoryId,
             itemCode, isAvailable]
          );
          created++;
        }
        await client.query('RELEASE SAVEPOINT row_savepoint');
      } catch (err) {
        await client.query('ROLLBACK TO SAVEPOINT row_savepoint');
        console.error(`Row ${row.id} failed:`, err.message);
        errors++;
      }
    }
    await client.query('COMMIT');
    console.log(`Import: created=${created}, updated=${updated}, errors=${errors}`);
    return { success: true, created, updated, errors };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { dryRunImport, importMenu };