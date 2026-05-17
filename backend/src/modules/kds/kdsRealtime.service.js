const admin =
  require('../../config/firebase');

async function pushOrderToKDS(
  order
) {

  const db =
    admin.firestore();

  await db
    .collection('active_orders')
    .doc(order.id)
    .set({
      orderId: order.id,
      orderNo: order.order_no,
      organizationId:
        order.organization_id,
      outletId:
        order.outlet_id,
      orderStatus:
        order.order_status,
      orderSource:
        order.order_source,
      grandTotal:
        order.grand_total,
      createdAt:
        new Date().toISOString()
    });

}

module.exports = {
  pushOrderToKDS
};