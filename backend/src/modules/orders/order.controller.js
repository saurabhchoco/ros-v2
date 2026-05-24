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

  // ✅ Updated schema – NO price, only menuItemId
  const publicOrderSchema = z.object({
    outletId: z.string(),
    organizationId: z.string(),
    paymentMethod: z.enum(['CASH', 'UPI', 'CARD']).default('CASH'),
    items: z.array(z.object({
      menuItemId: z.string(),      // ← Only ID sent from frontend
      quantity: z.number().positive()
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

  const { outletId, organizationId, items, customerName, customerMobile, paymentProof, paymentMethod } = result.data;
  
  // ✅ STEP 1: Generate token
  const token = await orderService.generateToken(outletId);
  
  // ✅ STEP 2: Fetch prices from database for each item
  let subtotal = 0;
  const validatedItems = [];

  for (const item of items) {
    // Query database for the actual price
    const menuItemResult = await pool.query(
      `SELECT id, name, base_price, organization_id, outlet_id
       FROM menu_items
       WHERE id = $1 
         AND organization_id = $2 
         AND outlet_id = $3
         AND is_available = true`,
      [item.menuItemId, organizationId, outletId]
    );
    
    // If item not found or not available for this outlet
    if (menuItemResult.rows.length === 0) {
      return reply.status(400).send({
        success: false,
        message: `Item ${item.menuItemId} not found or not available for this outlet`
      });
    }
    
    const dbItem = menuItemResult.rows[0];
    const lineTotal = item.quantity * dbItem.base_price;
    subtotal += lineTotal;
    
    // Store validated item with database price (NOT from frontend)
    validatedItems.push({
      menuItemId: item.menuItemId,
      itemName: dbItem.name,
      quantity: item.quantity,
      unitPrice: dbItem.base_price,  // ← From database, NOT frontend
      lineTotal: lineTotal
    });
  }
  
  const taxAmount = 0;
  const discountAmount = 0;
  const grandTotal = subtotal + taxAmount - discountAmount;
  
  // ✅ STEP 3: Insert order using validated data
  const orderId = generateId('ord');
  const orderNo = `QR-${Date.now()}`;
  
  await pool.query(
    `INSERT INTO orders (
      id, organization_id, outlet_id, order_no, order_source, order_status,
      customer_name, customer_mobile, subtotal, tax_amount, discount_amount, 
      grand_total, payment_status, token_number, source, payment_method, created_at, updated_at
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,$16, NOW(), NOW())`,
    [
      orderId, organizationId, outletId, orderNo, 'PUBLIC_QR', 'NEW',
      customerName || null, customerMobile || null, subtotal, taxAmount, discountAmount,
      grandTotal, paymentProof ? 'PENDING_PROOF' : 'PENDING', token, 'PUBLIC_QR', paymentMethod || 'CASH'
    ]
  );
  
  // ✅ STEP 4: Insert order items using validated items (NOT from frontend)
  for (const item of validatedItems) {
    await pool.query(
      `INSERT INTO order_items (
        id, order_id, menu_item_id, item_name, quantity, unit_price, line_total, created_at
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
      [
        generateId('itm'), 
        orderId, 
        item.menuItemId, 
        item.itemName, 
        item.quantity, 
        item.unitPrice,   // ← From database
        item.lineTotal
      ]
    );
  }
  
  // ✅ STEP 5: Push to Firestore for real-time vendor update
  const orderData = {
    id: orderId,
    orderNo,
    token,
    items: validatedItems.map(i => `${i.quantity}x ${i.itemName}`).join(', '),
    grandTotal,
    status: 'NEW',
    outletId,
    createdAt: new Date().toISOString(),
    paymentMethod: paymentMethod || 'CASH'
  };
  
  await admin.firestore().collection('active_orders').doc(orderId).set(orderData);
  
  // ✅ STEP 6: Estimate wait time
  const pendingCount = await pool.query(
    `SELECT COUNT(*) FROM orders 
     WHERE outlet_id = $1 AND order_status IN ('NEW', 'PREPARING')`,
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