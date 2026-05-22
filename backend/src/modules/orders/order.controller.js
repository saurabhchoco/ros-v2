const { z } = require('zod');
const pool = require('../../config/db');
const { generateId } = require('../../utils/generateId');
const admin = require('../../config/firebase');
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
  const { status } = request.body;

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
      request.userContext
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

  // Manual validation with Zod
  const publicOrderSchema = z.object({
    outletId: z.string(),
    organizationId: z.string(),
    items: z.array(z.object({
      itemName: z.string(),
      quantity: z.number().positive(),
      unitPrice: z.number().positive()
    })),
    customerName: z.string().optional(),
    customerMobile: z.string().optional(),
    paymentProof: z.string().optional()
  });

  const result = publicOrderSchema.safeParse(request.body);
  if (!result.success) {
    return reply.status(400).send({ 
      success: false, 
      message: 'Validation failed', 
      errors: result.error.errors 
    });
  }

  // ✅ Use result.data, NOT request.body again
  const { outletId, organizationId, items, customerName, customerMobile, paymentProof } = result.data;
  
  // Generate token
  const token = await orderService.generateToken(outletId);
  
  // Calculate totals
  let subtotal = 0;
  for (const item of items) subtotal += item.quantity * item.unitPrice;
  const taxAmount = 0;
  const grandTotal = subtotal;
  
  // Insert order
  const orderId = generateId('ord');
  const orderNo = `QR-${Date.now()}`;
  await pool.query(
    `INSERT INTO orders (id, organization_id, outlet_id, order_no, order_source, order_status,
      customer_name, customer_mobile, subtotal, tax_amount, grand_total, payment_status, token_number, source)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'PUBLIC_QR')`,
    [orderId, organizationId, outletId, orderNo, 'PUBLIC_QR', 'NEW',
     customerName, customerMobile, subtotal, taxAmount, grandTotal, 'PENDING_PROOF', token]
  );
  
  // Insert order items
  for (const item of items) {
    await pool.query(
      `INSERT INTO order_items (id, order_id, item_name, quantity, unit_price, line_total)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [generateId('itm'), orderId, item.itemName, item.quantity, item.unitPrice, item.quantity * item.unitPrice]
    );
  }
  
  // Push to Firestore active_orders
  const orderData = {
    id: orderId,
    orderNo,
    token,
    items: items.map(i => `${i.quantity}x ${i.itemName}`).join(', '),
    grandTotal,
    status: 'NEW',
    outletId,
    createdAt: new Date().toISOString()
  };
  await admin.firestore().collection('active_orders').doc(orderId).set(orderData);
  
  // Estimate wait time
  const pendingCount = await pool.query(
    `SELECT COUNT(*) FROM orders WHERE outlet_id = $1 AND order_status IN ('NEW','PREPARING')`,
    [outletId]
  );
  const waitMinutes = Math.max(2, Math.ceil(pendingCount.rows[0].count * 1.5));
  
  return reply.send({
    success: true,
    data: { orderId, token, waitMinutes, grandTotal }
  });
}

module.exports = {
  createOrder,
  updateOrderStatus,
  listOrders,
  getOrderById,
  createPublicOrder
};