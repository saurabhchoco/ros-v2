const pool = require('../config/db');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

function isValidId(id) {
  return id && typeof id === 'string' && id.trim() !== '' && id !== 'undefined';
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
      // Do NOT push per‑row warning
    } else {
      toUpdateCount++;
    }

    // Check category existence (if you want to track)
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

async function importMenu(validRows, outletId, organizationId) {
  const client = await pool.connect();
  let created = 0, updated = 0, errors = 0;
  try {
    await client.query('BEGIN');
    for (const row of validRows) {
      try {
        // Get or create category
        const categoryId = await getOrCreateCategory(row.category, outletId, organizationId, client);
        if (!categoryId) {
          errors++;
          continue;
        }
        // Check if item already exists in this outlet (by CSV id or by name? Usually by id)
        const existing = await client.query(
          `SELECT id FROM menu_items WHERE id = $1 AND outlet_id = $2`,
          [row.id, outletId]
        );
        if (existing.rows.length > 0) {
          // Update existing item
          await client.query(
            `UPDATE menu_items SET
              name = $1, base_price = $2, description = $3, is_veg = $4,
              status = $5, category_id = $6, updated_at = NOW()
             WHERE id = $7 AND outlet_id = $8`,
            [row.name, row.base_price, row.description, row.is_veg === '1' || row.is_veg === 'true',
             row.status, categoryId, row.id, outletId]
          );
          updated++;
        } else {
          // Insert new item – generate new ID if CSV id already used elsewhere
          let newId = row.id;
          const idCheck = await client.query(`SELECT 1 FROM menu_items WHERE id = $1`, [newId]);
          if (idCheck.rows.length > 0) {
            newId = `itm_${crypto.randomBytes(5).toString('hex')}`;
          }
          await client.query(
            `INSERT INTO menu_items (
              id, name, base_price, description, is_veg, status,
              organization_id, outlet_id, category_id, item_type, is_available
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
            [newId, row.name, row.base_price, row.description, row.is_veg === '1' || row.is_veg === 'true',
             row.status, organizationId, outletId, categoryId, 'SIMPLE', true]
          );
          created++;
        }
      } catch (err) {
        console.error(`Failed row ${row.id}:`, err.message);
        errors++;
      }
    }
    await client.query('COMMIT');
    console.log(`Import completed: created=${created}, updated=${updated}, errors=${errors}`);
    return { success: true, created, updated, errors };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}


async function getOrCreateCategory(categoryName, outletId, organizationId, client) {
  if (!categoryName) return null;
  // Try to find existing category
  let res = await client.query(
    `SELECT id FROM menu_categories WHERE name = $1 AND outlet_id = $2 AND organization_id = $3`,
    [categoryName, outletId, organizationId]
  );
  if (res.rows.length > 0) return res.rows[0].id;
  // Create new category
  const newId = `cat_${crypto.randomBytes(5).toString('hex')}`;
  await client.query(
    `INSERT INTO menu_categories (id, name, outlet_id, organization_id, display_order)
     VALUES ($1, $2, $3, $4, (SELECT COALESCE(MAX(display_order), 0) + 1 FROM menu_categories WHERE outlet_id = $3))`,
    [newId, categoryName, outletId, organizationId]
  );
  return newId;
}

module.exports = { dryRunImport, importMenu };