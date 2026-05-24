const inventoryController = require('./inventory.controller');
const authMiddleware = require('../../middleware/authMiddleware');
const userContextMiddleware = require('../../middleware/userContextMiddleware');
const roleMiddleware = require('../../middleware/roleMiddleware');

async function inventoryRoutes(app) {
  // All inventory routes require authentication and user context
  const commonPreHandler = [authMiddleware, userContextMiddleware];

  // Brand owner or outlet manager can access inventory
  const inventoryAccess = [...commonPreHandler, roleMiddleware(['OUTLET_MANAGER'])];

  app.get('/api/v1/inventory', { preHandler: inventoryAccess }, inventoryController.listInventory);
  app.get('/api/v1/inventory/:id', { preHandler: inventoryAccess }, inventoryController.getInventoryItem);
  app.post('/api/v1/inventory', { preHandler: inventoryAccess }, inventoryController.createInventoryItem);
  app.put('/api/v1/inventory/:id', { preHandler: inventoryAccess }, inventoryController.updateInventoryItem);
  app.post('/api/v1/inventory/:id/adjust', { preHandler: inventoryAccess }, inventoryController.adjustStock);
  app.get('/api/v1/inventory/health', { preHandler: inventoryAccess }, inventoryController.getStockHealth);
  app.get('/api/v1/inventory/low-stock', { preHandler: inventoryAccess }, inventoryController.getLowStockItems);
}

module.exports = inventoryRoutes;