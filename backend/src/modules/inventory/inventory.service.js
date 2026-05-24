const pool = require('../../config/db');
const { generateId } = require('../../utils/generateId');

// ---------- CRUD ----------
async function listInventoryItems(organizationId, outletId) {
  const result = await pool.query(`
    SELECT i.*,
           COUNT(t.id) as transaction_count
    FROM inventory_items i
    LEFT JOIN inventory_transactions t ON t.inventory_item_id = i.id
    WHERE i.organization_id = $1 AND i.outlet_id = $2
    GROUP BY i.id
    ORDER BY i.name
  `, [organizationId, outletId]);
  return result.rows;
}

async function getInventoryItem(id, organizationId, outletId) {
  const result = await pool.query(`
    SELECT * FROM inventory_items
    WHERE id = $1 AND organization_id = $2 AND outlet_id = $3
  `, [id, organizationId, outletId]);
  return result.rows[0];
}

async function createInventoryItem(data, userId) {
  const id = generateId('inv');
  const result = await pool.query(`
    INSERT INTO inventory_items (
      id, organization_id, outlet_id, name, current_stock, low_stock_threshold,
      base_unit, conversion_factor_to_base, created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
    RETURNING *
  `, [id, data.organizationId, data.outletId, data.name,
      data.currentStock || 0, data.lowStockThreshold || 0,
      data.baseUnit || 'g', data.conversionFactor || 1.0]);
  return result.rows[0];
}

async function updateInventoryItem(id, organizationId, outletId, updates) {
  const fields = [];
  const values = [];
  let idx = 1;
  if (updates.name !== undefined) { fields.push(`name = $${idx++}`); values.push(updates.name); }
  if (updates.currentStock !== undefined) { fields.push(`current_stock = $${idx++}`); values.push(updates.currentStock); }
  if (updates.lowStockThreshold !== undefined) { fields.push(`low_stock_threshold = $${idx++}`); values.push(updates.lowStockThreshold); }
  if (updates.baseUnit !== undefined) { fields.push(`base_unit = $${idx++}`); values.push(updates.baseUnit); }
  if (updates.conversionFactor !== undefined) { fields.push(`conversion_factor_to_base = $${idx++}`); values.push(updates.conversionFactor); }
  fields.push(`updated_at = NOW()`);
  values.push(id, organizationId, outletId);
  const query = `UPDATE inventory_items SET ${fields.join(', ')} WHERE id = $${idx++} AND organization_id = $${idx++} AND outlet_id = $${idx++} RETURNING *`;
  const result = await pool.query(query, values);
  return result.rows[0];
}

// ---------- Stock Adjustment ----------
async function adjustStock(itemId, changeQuantity, reason, source, referenceId, userId, organizationId, outletId) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Update current stock (allow negative)
    const updateRes = await client.query(`
      UPDATE inventory_items
      SET current_stock = current_stock + $1,
          updated_at = NOW()
      WHERE id = $2 AND organization_id = $3 AND outlet_id = $4
      RETURNING current_stock
    `, [changeQuantity, itemId, organizationId, outletId]);

    if (!updateRes.rows[0]) throw new Error('Inventory item not found');

    // Log transaction
    const txId = generateId('txn');
    await client.query(`
      INSERT INTO inventory_transactions (
        id, inventory_item_id, change_quantity, reason, source, reference_id, created_by, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
    `, [txId, itemId, changeQuantity, reason, source, referenceId, userId]);

    await client.query('COMMIT');
    return { newStock: updateRes.rows[0].current_stock };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// ---------- Low Stock / Health Stats ----------
async function getStockHealth(organizationId, outletId) {
  const result = await pool.query(`
    SELECT
      COUNT(*) as total_items,
      COUNT(CASE WHEN current_stock < low_stock_threshold THEN 1 END) as low_stock_count,
      ROUND(
        (COUNT(CASE WHEN current_stock >= low_stock_threshold THEN 1 END)::decimal / NULLIF(COUNT(*), 0)) * 100,
        1
      ) as stock_health_pct
    FROM inventory_items
    WHERE organization_id = $1 AND outlet_id = $2
  `, [organizationId, outletId]);
  return {
    totalItems: parseInt(result.rows[0].total_items || 0),
    lowStockCount: parseInt(result.rows[0].low_stock_count || 0),
    stockHealthPct: parseFloat(result.rows[0].stock_health_pct || 100)
  };
}

async function getLowStockItems(organizationId, outletId) {
  const result = await pool.query(`
    SELECT id, name, current_stock, low_stock_threshold, base_unit
    FROM inventory_items
    WHERE organization_id = $1 AND outlet_id = $2 AND current_stock < low_stock_threshold
    ORDER BY (current_stock / NULLIF(low_stock_threshold,0)) ASC
    LIMIT 20
  `, [organizationId, outletId]);
  return result.rows;
}

// ---------- Order Deduction (called inside order.service) ----------
async function deductIngredientsForOrderItems(orderItems, organizationId, outletId, orderId, userId) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const item of orderItems) {
      const bom = await client.query(`
        SELECT mii.quantity, ii.id as inventory_item_id
        FROM menu_item_ingredients mii
        JOIN inventory_items ii ON mii.inventory_item_id = ii.id
        WHERE mii.menu_item_id = $1
      `, [item.menuItemId]);
      for (const ing of bom.rows) {
        const totalDeduct = ing.quantity * item.quantity;
        // Update inventory stock
        const updateResult = await client.query(`
        UPDATE inventory_items
        SET current_stock = current_stock - $1,
            updated_at = NOW()
        WHERE id = $2 AND organization_id = $3 AND outlet_id = $4
        RETURNING current_stock
        `, [totalDeduct, ing.inventory_item_id, organizationId, outletId]);

        if (updateResult.rowCount === 0) {
        throw new Error(`Inventory item ${ing.inventory_item_id} not found for org ${organizationId} outlet ${outletId}`);
        }
        // Log transaction
        const txId = generateId('txn');
        await client.query(`
          INSERT INTO inventory_transactions (
            id, inventory_item_id, change_quantity, reason, source, reference_id, created_by, created_at
          ) VALUES ($1, $2, $3, 'ORDER', 'PUBLIC_QR', $4, $5, NOW())
        `, [txId, ing.inventory_item_id, -totalDeduct, orderId, userId]);
      }
    }
    await client.query('COMMIT');
    return { success: true };
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Inventory deduction error:', err);
    throw err;
  } finally {
    client.release();
  }
}

module.exports = {
  listInventoryItems,
  getInventoryItem,
  createInventoryItem,
  updateInventoryItem,
  adjustStock,
  getStockHealth,
  getLowStockItems,
  deductIngredientsForOrderItems
};