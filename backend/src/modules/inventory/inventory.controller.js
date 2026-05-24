const inventoryService = require('./inventory.service');

async function listInventory(request, reply) {
  const { organization_id, outlet_id } = request.userContext;
  const items = await inventoryService.listInventoryItems(organization_id, outlet_id);
  return reply.send({ success: true, data: items });
}

async function getInventoryItem(request, reply) {
  const { id } = request.params;
  const { organization_id, outlet_id } = request.userContext;
  const item = await inventoryService.getInventoryItem(id, organization_id, outlet_id);
  if (!item) {
    return reply.status(404).send({ success: false, message: 'Item not found' });
  }
  return reply.send({ success: true, data: item });
}

async function createInventoryItem(request, reply) {
  const { organization_id, outlet_id, id: userId } = request.userContext;
  const data = {
    ...request.body,
    organizationId: organization_id,
    outletId: outlet_id
  };
  const newItem = await inventoryService.createInventoryItem(data, userId);
  return reply.send({ success: true, data: newItem });
}

async function updateInventoryItem(request, reply) {
  const { id } = request.params;
  const { organization_id, outlet_id } = request.userContext;
  const updated = await inventoryService.updateInventoryItem(id, organization_id, outlet_id, request.body);
  if (!updated) {
    return reply.status(404).send({ success: false, message: 'Item not found' });
  }
  return reply.send({ success: true, data: updated });
}

async function adjustStock(request, reply) {
  const { id } = request.params;
  const { change, reason, source, referenceId } = request.body;
  const { organization_id, outlet_id, id: userId } = request.userContext;
  if (!change || !reason) {
    return reply.status(400).send({ success: false, message: 'change and reason are required' });
  }
  const result = await inventoryService.adjustStock(
    id, change, reason, source || 'MANUAL', referenceId || null, userId, organization_id, outlet_id
  );
  return reply.send({ success: true, data: { newStock: result.newStock } });
}

async function getStockHealth(request, reply) {
  const { organization_id, outlet_id } = request.userContext;
  const health = await inventoryService.getStockHealth(organization_id, outlet_id);
  return reply.send({ success: true, data: health });
}

async function getLowStockItems(request, reply) {
  const { organization_id, outlet_id } = request.userContext;
  const items = await inventoryService.getLowStockItems(organization_id, outlet_id);
  return reply.send({ success: true, data: items });
}

module.exports = {
  listInventory,
  getInventoryItem,
  createInventoryItem,
  updateInventoryItem,
  adjustStock,
  getStockHealth,
  getLowStockItems
};