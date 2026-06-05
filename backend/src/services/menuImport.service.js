const pool = require('../config/db');
const { v4: uuidv4 } = require('uuid');

function isValidId(id) {
  return id && typeof id === 'string' && id.trim() !== '' && id !== 'undefined';
}

async function dryRunImport(validRows, outletId, organizationId) {
  const warnings = [];
  let toCreateCount = 0;
  let toUpdateCount = 0;

  if (!isValidId(outletId)) throw new Error(`Invalid outletId: ${outletId}`);
  if (!isValidId(organizationId)) throw new Error(`Invalid organizationId: ${organizationId}`);

  for (const row of validRows) {
    const catRes = await pool.query(
      `SELECT id FROM menu_categories WHERE name ILIKE $1 AND outlet_id = $2`,
      [row.category, outletId]
    );
    if (!catRes.rows.length) {
      warnings.push(`Category "${row.category}" will be created.`);
    }

    if (row.id) {
      const existing = await pool.query(
        `SELECT id FROM menu_items WHERE id = $1 AND outlet_id = $2`,
        [row.id, outletId]
      );
      if (existing.rows.length) {
        toUpdateCount++;
      } else {
        warnings.push(`Row with id ${row.id} not found – will create new item.`);
        toCreateCount++;
      }
    } else {
      toCreateCount++;
    }
  }

  return { toCreateCount, toUpdateCount, warnings };
}

async function importMenu(validRows, outletId, organizationId) {
  // ---- Validate IDs ----
  if (!isValidId(outletId)) throw new Error(`Invalid outletId: ${outletId}`);
  if (!isValidId(organizationId)) throw new Error(`Invalid organizationId: ${organizationId}`);
  
  const safeOutletId = outletId.trim();
  const safeOrgId = organizationId.trim();

  console.log(`[DEBUG] Importing with outletId=${safeOutletId} (type ${typeof safeOutletId})`);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    for (const row of validRows) {
      // ---- Ensure category exists ----
      let categoryId;
      const catRes = await client.query(
        `SELECT id FROM menu_categories WHERE name ILIKE $1 AND outlet_id = $2`,
        [row.category, safeOutletId]
      );
      if (catRes.rows.length) {
        categoryId = catRes.rows[0].id;
      } else {
        const newId = uuidv4();
        await client.query(
          `INSERT INTO menu_categories (id, organization_id, outlet_id, name, display_order, created_at)
           VALUES ($1, $2, $3::text, $4, (SELECT COALESCE(MAX(display_order),0)+1 FROM menu_categories WHERE outlet_id=$3::text), NOW())`,
          [newId, safeOrgId, safeOutletId, String(row.category)]
        );
        categoryId = newId;
      }

      // ---- Prepare typed values ----
      const itemId = row.id ? String(row.id) : uuidv4();

      let basePrice = 0;
      if (row.base_price !== undefined && row.base_price !== '') {
        basePrice = parseFloat(row.base_price);
        if (isNaN(basePrice)) throw new Error(`Invalid base_price: ${row.base_price}`);
      }

      let isVeg = false;
      if (row.is_veg !== undefined && row.is_veg !== '') {
        if (typeof row.is_veg === 'boolean') isVeg = row.is_veg;
        else if (typeof row.is_veg === 'string') isVeg = row.is_veg.toLowerCase() === 'true';
        else if (typeof row.is_veg === 'number') isVeg = row.is_veg === 1;
      }

      const status = row.status && typeof row.status === 'string' ? row.status : 'active';

      let modifierGroups = null;
      if (row.modifier_groups) {
        if (typeof row.modifier_groups === 'object') {
          modifierGroups = JSON.stringify(row.modifier_groups);
        } else if (typeof row.modifier_groups === 'string') {
          modifierGroups = row.modifier_groups;
        }
      }

      // ---- Upsert menu item (with explicit casting of $3) ----
      await client.query(
        `INSERT INTO menu_items (
          id, organization_id, outlet_id, category_id, name, description,
          base_price, is_veg, status, modifier_groups, created_at, updated_at
        ) VALUES ($1, $2, $3::text, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
        ON CONFLICT (id) DO UPDATE SET
          category_id = EXCLUDED.category_id,
          name = EXCLUDED.name,
          description = EXCLUDED.description,
          base_price = EXCLUDED.base_price,
          is_veg = EXCLUDED.is_veg,
          status = EXCLUDED.status,
          modifier_groups = EXCLUDED.modifier_groups,
          updated_at = NOW()`,
        [
          itemId,
          safeOrgId,
          safeOutletId,
          categoryId,
          String(row.name || ''),
          String(row.description || ''),
          basePrice,
          isVeg,
          status,
          modifierGroups
        ]
      );

      // ---- Handle variants ----
      await client.query(`DELETE FROM menu_item_variants WHERE menu_item_id = $1`, [itemId]);
      if (row.variants && Array.isArray(row.variants)) {
        for (const variant of row.variants) {
          const variantPrice = variant.price !== undefined && variant.price !== ''
            ? parseFloat(variant.price)
            : 0;
          await client.query(
            `INSERT INTO menu_item_variants (id, menu_item_id, name, price, is_default)
             VALUES ($1, $2, $3, $4, $5)`,
            [
              uuidv4(),
              itemId,
              String(variant.name || ''),
              variantPrice,
              variant.is_default === true
            ]
          );
        }
      }
    }

    await client.query('COMMIT');
    return { success: true, imported: validRows.length };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { dryRunImport, importMenu };