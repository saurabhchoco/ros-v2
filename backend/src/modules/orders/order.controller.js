const { z } = require('zod');
const pool = require('../../config/db');
const { generateId } = require('../../utils/generateId');
const admin = require('../../config/firebase');
const inventoryService = require('../inventory/inventory.service');
const {
  createOrderSchema
} = require('./order.schema');

const orderService =
  require('./order.service');

async function createOrder(
  request,
  reply
) {

  const parsed =
    createOrderSchema.safeParse(
      request.body
    );

  if (!parsed.success) {

    return reply.status(400).send({
      success: false,
      message: 'Validation failed',
      error: parsed.error
    });

  }

  const order =
    await orderService.createOrder(
      parsed.data
    );

  return reply.send({
    success: true,
    message: 'Order created successfully',
    data: order
  });
}

async function updateOrderStatus(
  request,
  reply
) {

  const { orderId } = request.params;
  const { status, cancellationReason } = request.body;

  if (!status) {
    return reply.status(400).send({
      success: false,
      message: 'status is required in request body'
    });
  }

  const order =
    await orderService.updateOrderStatus(
      orderId,
      status,
      request.userContext,
      cancellationReason
    );

  return reply.send({
    success: true,
    message: `Order status updated to ${status}`,
    data: order
  });

}

async function listOrders(
  request,
  reply
) {

  const { status, startDate, endDate } =
    request.query;

  const orders =
    await orderService.listOrders(
      request.userContext.organization_id,
      request.userContext.outlet_id,
      { status, startDate, endDate }
    );

  return reply.send({
    success: true,
    data: orders
  });

}

async function getOrderById(
  request,
  reply
) {

  const { orderId } = request.params;

  const order =
    await orderService.getOrderById(
      orderId,
      request.userContext.organization_id
    );

  return reply.send({
    success: true,
    data: order
  });

}

async function createPublicOrder(request, reply) {
  const { z } = require('zod');
  const pool = require('../../config/db');
  const { generateId } = require('../../utils/generateId');
  const admin = require('../../config/firebase');
  const orderService = require('./order.service');
  const inventoryService = require('../inventory/inventory.service');

  const publicOrderSchema = z.object({
    outletId: z.string(),
    organizationId: z.string(),
    paymentMethod: z.enum(['CASH', 'UPI', 'CARD']).default('CASH'),
    items: z.array(z.object({
      menuItemId: z.string(),
      quantity: z.number().positive()
    })),
    customerName: z.string().optional(),
    customerMobile: z.string().optional(),
    paymentProof: z.string().optional()
  });

  const result = publicOrderSchema.safeParse(request.body);
  if (!result.success) {
    return reply.status(400).send({ success: false, message: 'Validation failed', errors: result.error.errors });
  }

  const { outletId, organizationId, items, customerName, customerMobile, paymentProof, paymentMethod } = result.data;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Generate token
    const token = await orderService.generateToken(outletId);

    // Fetch prices and build validatedItems
    let subtotal = 0;
    const validatedItems = [];
    for (const item of items) {
      const menuItemResult = await client.query(
        `SELECT id, name, base_price FROM menu_items
         WHERE id = $1 AND organization_id = $2 AND outlet_id = $3 AND is_available = true`,
        [item.menuItemId, organizationId, outletId]
      );
      if (menuItemResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return reply.status(400).send({ success: false, message: `Item ${item.menuItemId} not found or unavailable` });
      }
      const dbItem = menuItemResult.rows[0];
      const lineTotal = item.quantity * dbItem.base_price;
      subtotal += lineTotal;
      validatedItems.push({
        menuItemId: item.menuItemId,
        itemName: dbItem.name,
        quantity: item.quantity,
        unitPrice: dbItem.base_price,
        lineTotal
      });
    }

    const taxAmount = 0;
    const discountAmount = 0;
    const grandTotal = subtotal + taxAmount - discountAmount;

    const orderId = generateId('ord');
    const orderNo = `QR-${Date.now()}`;

    // Insert order
    await client.query(
      `INSERT INTO orders (
        id, organization_id, outlet_id, order_no, order_source, order_status,
        customer_name, customer_mobile, subtotal, tax_amount, discount_amount,
        grand_total, payment_status, token_number, source, payment_method, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW(), NOW())`,
      [
        orderId, organizationId, outletId, orderNo, 'PUBLIC_QR', 'NEW',
        customerName || null, customerMobile || null, subtotal, taxAmount, discountAmount,
        grandTotal, paymentProof ? 'PENDING_PROOF' : 'PENDING', token, 'PUBLIC_QR', paymentMethod
      ]
    );

    // Insert order items
    for (const item of validatedItems) {
      await client.query(
        `INSERT INTO order_items (
          id, order_id, menu_item_id, item_name, quantity, unit_price, line_total, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
        [generateId('itm'), orderId, item.menuItemId, item.itemName, item.quantity, item.unitPrice, item.lineTotal]
      );
    }
console.log('Calling inventory deduction for order', orderId);
    // ***** INVENTORY DEDUCTION *****
    await inventoryService.deductIngredientsForOrderItems(
      validatedItems.map(i => ({ menuItemId: i.menuItemId, quantity: i.quantity })),
      organizationId,
      outletId,
      orderId,
      null
    );
    console.log('Inventory deduction finished');
    // *****************************

    await client.query('COMMIT');

    // Push to Firestore for real-time vendor update
    const orderData = {
      id: orderId,
      orderNo,
      token,
      items: validatedItems.map(i => `${i.quantity}x ${i.itemName}`).join(', '),
      grandTotal,
      status: 'NEW',
      outletId,
      createdAt: new Date().toISOString(),
      paymentMethod
    };
    await admin.firestore().collection('active_orders').doc(orderId).set(orderData);

    // Estimate wait time
    const pendingCount = await pool.query(
      `SELECT COUNT(*) FROM orders WHERE outlet_id = $1 AND order_status IN ('NEW', 'PREPARING')`,
      [outletId]
    );
    const waitMinutes = Math.max(2, Math.ceil(pendingCount.rows[0].count * 1.5));

    return reply.send({ success: true, data: { orderId, token, waitMinutes, grandTotal } });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Public order creation failed:', error);
    return reply.status(500).send({ success: false, message: 'Internal server error' });
  } finally {
    client.release();
  }
}

module.exports = {
  createOrder,
  updateOrderStatus,
  listOrders,
  getOrderById,
  createPublicOrder
};