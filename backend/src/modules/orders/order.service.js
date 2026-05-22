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

async function createOrder(data) {

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
        payment_status
      )
      VALUES (
        $1,$2,$3,$4,$5,$6,
        $7,$8,$9,$10,$11,$12,$13,$14,$15
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
      'PENDING'
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
            data.createdBy || null,
        action:
            'ORDER_CREATED',
        entityType:
            'ORDER',
        entityId:
            orderId,
        newValue:
            orderResult.rows[0]
        });

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

async function updateOrderStatus(
  orderId,
  status,
  userContext
) {

  const validStatuses = [
    'NEW',
    'PREPARING',
    'READY',
    'COMPLETED',
    'CANCELLED'
  ];

  if (!validStatuses.includes(status)) {
    const error = new Error(
      `Invalid status. Must be one of: ${validStatuses.join(', ')}`
    );
    error.statusCode = 400;
    throw error;
  }

  const result = await pool.query(
    `
    UPDATE orders
    SET
      order_status = $1,
      updated_at = NOW()
    WHERE
      id = $2
    AND
      organization_id = $3
    RETURNING *
    `,
    [
      status,
      orderId,
      userContext.organization_id
    ]
  );

  if (!result.rows[0]) {
    const error = new Error('Order not found');
    error.statusCode = 404;
    throw error;
  }

  await updateOrderInKDS(orderId, status);

  await createAuditLog({
    organizationId: userContext.organization_id,
    outletId: userContext.outlet_id,
    userId: userContext.id,
    action: 'ORDER_STATUS_UPDATED',
    entityType: 'ORDER',
    entityId: orderId,
    newValue: { status }
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
  const today = new Date().toISOString().slice(0,10);
  const result = await pool.query(
    `SELECT token_number FROM orders 
     WHERE outlet_id = $1 AND DATE(created_at) = $2
     ORDER BY token_number DESC LIMIT 1`,
    [outletId, today]
  );
  let lastNum = 0;
  if (result.rows[0] && result.rows[0].token_number) {
    const match = result.rows[0].token_number.match(/\d+/);
    if (match) lastNum = parseInt(match[0]);
  }
  const newNum = lastNum + 1;
  const prefixRes = await pool.query(`SELECT token_prefix FROM outlets WHERE id = $1`, [outletId]);
  const prefix = prefixRes.rows[0]?.token_prefix || 'A';
  return `${prefix}${newNum.toString().padStart(3, '0')}`;
}

module.exports = {
  createOrder,
  updateOrderStatus,
  listOrders,
  getOrderById,
  generateToken
};