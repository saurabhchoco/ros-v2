const admin =
  require('../../config/firebase');

async function pushOrderToKDS(order) {

  const db = admin.firestore();

  await db
    .collection('active_orders')
    .doc(order.id)
    .set({
      orderId: order.id,
      orderNo: order.order_no,
      organizationId: order.organization_id,
      outletId: order.outlet_id,
      orderStatus: order.order_status,
      orderSource: order.order_source,
      grandTotal: order.grand_total,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

}

async function updateOrderInKDS(orderId, status) {

  const db = admin.firestore();

  if (status === 'COMPLETED' || status === 'CANCELLED') {

    // Move to archived, remove from active
    const doc = await db
      .collection('active_orders')
      .doc(orderId)
      .get();

    if (doc.exists) {
      await db
        .collection('archived_orders')
        .doc(orderId)
        .set({
          ...doc.data(),
          orderStatus: status,
          updatedAt: new Date().toISOString()
        });

      await db
        .collection('active_orders')
        .doc(orderId)
        .delete();
    }

  } else {

    // Just update status in active_orders
    await db
      .collection('active_orders')
      .doc(orderId)
      .update({
        orderStatus: status,
        updatedAt: new Date().toISOString()
      });

  }

}

module.exports = {
  pushOrderToKDS,
  updateOrderInKDS
};