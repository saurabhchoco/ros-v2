const pool = require('../../config/db');
const {
  generateId
} = require('../../utils/generateId');

const {
  createAuditLog
} = require('../audit/audit.service');

const {
  pushOrderToKDS,
  updateOrderInKDS
} = require('../kds/kdsRealtime.service');

const inventoryService = require('../inventory/inventory.service');
const { getActiveShiftForUser } = require('../shift/shift.service');

async function createOrder(data, userId = null) {
console.log('createOrder called with userId:', userId);
  const client = await pool.connect();

  try {

    await client.query('BEGIN');

    const orderId = generateId('ord');

    const orderNo =
      `ORD-${Date.now()}`;

    let subtotal = 0;

    for (const item of data.items) {
      subtotal += (
        item.quantity * item.unitPrice
      );
    }

    const taxAmount = 0;

    const discountAmount = 0;

    const grandTotal =
      subtotal +
      taxAmount -
      discountAmount;

    let assignedToUserId = userId;          // fallback
    let shiftSessionId = null;

    if (userId) {
      const activeShift = await getActiveShiftForUser(userId);
        console.log('activeShift found:', activeShift);
      if (activeShift) {
        assignedToUserId = userId;
        shiftSessionId = activeShift.id;
      } else {
        // Log warning – user has no active shift
        console.warn(`User ${userId} has no active shift when creating order`);
      }
    }
    const orderQuery = `
      INSERT INTO orders (
        id,
        organization_id,
        outlet_id,
        order_no,
        order_source,
        order_status,
        table_number,
        token_number,
        customer_name,
        customer_mobile,
        subtotal,
        tax_amount,
        discount_amount,
        grand_total,
        payment_status,
        payment_method,
        created_by,
        assigned_to_user_id,
        shift_session_id
      )
      VALUES (
        $1,$2,$3,$4,$5,$6,
        $7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19
      )
      RETURNING *
    `;

    const orderValues = [
      orderId,
      data.organizationId,
      data.outletId,
      orderNo,
      data.orderSource,
      'NEW',
      data.tableNumber || null,
      data.tokenNumber || null,
      data.customerName || null,
      data.customerMobile || null,
      subtotal,
      taxAmount,
      discountAmount,
      grandTotal,
      'PENDING',
      data.paymentMethod || 'CASH',
      userId,
      assignedToUserId,
      shiftSessionId  
    ];

    const orderResult =
      await client.query(
        orderQuery,
        orderValues
      );

    for (const item of data.items) {

      const orderItemId =
        generateId('itm');

      const lineTotal =
        item.quantity *
        item.unitPrice;

      const itemQuery = `
        INSERT INTO order_items (
          id,
          order_id,
          item_name,
          quantity,
          unit_price,
          line_total
        )
        VALUES (
          $1,$2,$3,$4,$5,$6
        )
      `;

      const itemValues = [
        orderItemId,
        orderId,
        item.itemName,
        item.quantity,
        item.unitPrice,
        lineTotal
      ];

      await client.query(
        itemQuery,
        itemValues
      );
    }

    await createAuditLog({
        organizationId:
            data.organizationId,
        outletId:
            data.outletId,
        userId:
            userId || null,
        action:
            'ORDER_CREATED',
        entityType:
            'ORDER',
        entityId:
            orderId,
        newValue:
            orderResult.rows[0]
        });

    //     // Deduct inventory
    // await inventoryService.deductIngredientsForOrderItems(
    //   validatedItems.map(i => ({ menuItemId: i.menuItemId, quantity: i.quantity })),
    //   data.organizationId,
    //   data.outletId,
    //   orderId,
    //   data.createdBy || null
    // );
    await client.query('COMMIT');

    await pushOrderToKDS(
        orderResult.rows[0]
    );

    return orderResult.rows[0];

  } catch (error) {
        await client.query('ROLLBACK');
        throw error;
  } finally {
        client.release();
  }
}

async function updateOrderStatus(orderId, status, userContext, cancellationReason = null) {
  const validStatuses = [
    'NEW', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED'
  ];
  if (!validStatuses.includes(status)) {
    const error = new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    error.statusCode = 400;
    throw error;
  }

  // Fetch current order to check current status and authorization
  const currentOrder = await pool.query(
    `SELECT order_status, organization_id FROM orders WHERE id = $1`,
    [orderId]
  );
  if (!currentOrder.rows[0]) {
    const error = new Error('Order not found');
    error.statusCode = 404;
    throw error;
  }
  if (currentOrder.rows[0].organization_id !== userContext.organization_id) {
    const error = new Error('Unauthorized');
    error.statusCode = 403;
    throw error;
  }

  const currentStatus = currentOrder.rows[0].order_status;

  // Cancellation: only allowed from NEW or PREPARING
  if (status === 'CANCELLED' && currentStatus !== 'NEW' && currentStatus !== 'PREPARING') {
    const error = new Error('Order cannot be cancelled after preparation is complete');
    error.statusCode = 400;
    throw error;
  }

  // Build dynamic UPDATE query
  let query = `
    UPDATE orders
    SET order_status = $1,
        updated_at = NOW()
  `;
  const params = [status, orderId, userContext.organization_id];

if (status === 'CANCELLED') {
  query = `
    UPDATE orders 
    SET order_status = $1, 
        updated_at = NOW(), 
        cancelled_at = NOW(), 
        cancellation_reason = $2,
        payment_status = 'NOT_APPLICABLE'
    WHERE id = $3 AND organization_id = $4
    RETURNING *
  `;
  params = [status, cancellationReason, orderId, organizationId];
}

  query += ` WHERE id = $2 AND organization_id = $3 RETURNING *`;

  const result = await pool.query(query, params);

  if (!result.rows[0]) {
    const error = new Error('Order not found');
    error.statusCode = 404;
    throw error;
  }

  // Update Firestore (KDS) and audit log
  await updateOrderInKDS(orderId, status);
  await createAuditLog({
    organizationId: userContext.organization_id,
    outletId: userContext.outlet_id,
    userId: userContext.id,
    action: 'ORDER_STATUS_UPDATED',
    entityType: 'ORDER',
    entityId: orderId,
    newValue: { status, cancellationReason }
  });

  return result.rows[0];
}

async function listOrders(
  organizationId,
  outletId,
  filters = {}
) {

  let query = `
    SELECT o.*, 
           json_agg(json_build_object(
             'id', oi.id,
             'itemName', oi.item_name,
             'quantity', oi.quantity,
             'unitPrice', oi.unit_price,
             'lineTotal', oi.line_total
           )) as items
    FROM orders o
    LEFT JOIN order_items oi ON o.id = oi.order_id
    WHERE o.organization_id = $1
    AND o.outlet_id = $2
  `;

  const params = [
    organizationId,
    outletId
  ];

  let paramCount = 2;

  if (filters.status) {
    paramCount += 1;
    query += ` AND o.order_status = $${paramCount}`;
    params.push(filters.status);
  }

  if (filters.startDate) {
    paramCount += 1;
    query += ` AND o.created_at >= $${paramCount}::date`;
    params.push(filters.startDate);
  }

  if (filters.endDate) {
    paramCount += 1;
    query += ` AND o.created_at < $${paramCount}::date + interval '1 day'`;
    params.push(filters.endDate);
  }

  query += ` GROUP BY o.id ORDER BY o.created_at DESC LIMIT 100`;

  const result = await pool.query(query, params);

  return result.rows;

}

async function getOrderById(
  orderId,
  organizationId
) {

  const result = await pool.query(
    `
    SELECT o.*, 
           json_agg(json_build_object(
             'id', oi.id,
             'itemName', oi.item_name,
             'quantity', oi.quantity,
             'unitPrice', oi.unit_price,
             'lineTotal', oi.line_total
           )) as items
    FROM orders o
    LEFT JOIN order_items oi ON o.id = oi.order_id
    WHERE o.id = $1
    AND o.organization_id = $2
    GROUP BY o.id
    `,
    [orderId, organizationId]
  );

  if (!result.rows[0]) {
    const error = new Error('Order not found');
    error.statusCode = 404;
    throw error;
  }

  return result.rows[0];

}

async function generateToken(outletId) {
  const client = await pool.connect();
  const today = new Date().toISOString().slice(0, 10);
  
  try {
    await client.query('BEGIN');
    
    // Ensure counter exists and reset date is current
    await client.query(
      `INSERT INTO outlet_counter (outlet_id, current_number, last_reset)
       VALUES ($1, 0, $2)
       ON CONFLICT (outlet_id) DO UPDATE
       SET current_number = CASE 
         WHEN outlet_counter.last_reset < $2 THEN 0 
         ELSE outlet_counter.current_number 
       END,
       last_reset = $2
       WHERE outlet_counter.outlet_id = $1`,
      [outletId, today]
    );
    
    // Lock the row and increment
    const result = await client.query(
      `UPDATE outlet_counter 
       SET current_number = current_number + 1
       WHERE outlet_id = $1
       RETURNING current_number`,
      [outletId]
    );
    
    const newNumber = result.rows[0].current_number;
  

    await client.query('COMMIT');
    
    // Get token prefix from outlet
    const prefixRes = await pool.query(
      `SELECT token_prefix FROM outlets WHERE id = $1`,
      [outletId]
    );
    const prefix = prefixRes.rows[0]?.token_prefix || 'A';
    
    return `${prefix}${newNumber.toString().padStart(3, '0')}`;
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Token generation error:', error);
    throw error;
  } finally {
    client.release();
  }
}

async function settleOrder(orderId, paymentMethod, userId, organizationId) { 
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await client.query(
      `UPDATE orders
       SET payment_status = 'PAID',
           payment_method = $1,
           updated_at = NOW()
       WHERE id = $2 
         AND organization_id = $3
         AND payment_status != 'PAID' 
         AND order_status != 'CANCELLED'
       RETURNING *`,
      [paymentMethod, orderId, organizationId]
    );
    if (!result.rows[0]) {
      // Check if order exists but is cancelled (within same org)
      const check = await client.query(
        `SELECT order_status FROM orders WHERE id = $1 AND organization_id = $2`,
        [orderId, organizationId]
      );
      if (check.rows.length > 0 && check.rows[0].order_status === 'CANCELLED') {
        throw new Error('Cannot settle a cancelled order');
      }
      throw new Error('Order not found or already settled');
    }
    await createAuditLog({
      organizationId: result.rows[0].organization_id,
      outletId: result.rows[0].outlet_id,
      userId: userId,
      action: 'ORDER_SETTLED',
      entityType: 'ORDER',
      entityId: orderId,
      newValue: { paymentMethod, status: 'PAID' }
    });
    await client.query('COMMIT');
    return result.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = {
  createOrder,
  updateOrderStatus,
  listOrders,
  getOrderById,
  generateToken,
  settleOrder
};