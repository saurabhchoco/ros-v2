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
        $7,$8,$9,$10,$11,$12,$13
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

module.exports = {
  createOrder,
  updateOrderStatus
};