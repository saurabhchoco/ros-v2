// backend/src/modules/shift/shift.routes.js
const authMiddleware = require('../../middleware/authMiddleware');
const userContextMiddleware = require('../../middleware/userContextMiddleware');
const roleMiddleware = require('../../middleware/roleMiddleware');
const {
  getActiveUsersHandler,
  getExpectedCashHandler,
  handoverShiftHandler,
  startShiftHandler,
  getActiveShiftHandler,
  endShiftHandler
} = require('./shift.controller');

async function shiftRoutes(app) {
  // GET active users for an outlet (Manager/ARM only)
  app.get(
    '/api/v1/shift/active-users',
    {
      preHandler: [
        authMiddleware,
        userContextMiddleware,
        roleMiddleware(['OUTLET_MANAGER', 'ARM', 'CAPTAIN', 'GSA', 'CASHIER', 'KITCHEN'])
      ],
      schema: {
        querystring: {
          type: 'object',
          required: ['outletId'],
          properties: {
            outletId: { type: 'string', minLength: 1 }
          }
        }
      }
    },
    getActiveUsersHandler
  );

  // GET expected cash for a cashier's shift session
  app.get(
    '/api/v1/shift/expected-cash',
    {
      preHandler: [
        authMiddleware,
        userContextMiddleware,
        roleMiddleware(['OUTLET_MANAGER', 'ARM'])
      ],
      schema: {
        querystring: {
          type: 'object',
          required: ['shiftSessionId'],
          properties: {
            shiftSessionId: { type: 'string', minLength: 1 }
          }
        }
      }
    },
    getExpectedCashHandler
  );

  // POST handover shift
  app.post(
    '/api/v1/shift/handover',
    {
      preHandler: [
        authMiddleware,
        userContextMiddleware
        // roleMiddleware(['OUTLET_MANAGER', 'ARM', 'CAPTAIN', 'GSA', 'CASHIER', 'KITCHEN'])
      ],
      schema: {
        body: {
          type: 'object',
          required: ['outletId', 'fromUserId', 'toUserId', 'requestId'],
          properties: {
            outletId: { type: 'string', minLength: 1 },
            fromUserId: { type: 'string', minLength: 1 },
            toUserId: { type: 'string', minLength: 1 },
            cashDeclared: { type: 'number', minimum: 0 },
            notes: { type: 'string' },
            requestId: { type: 'string', minLength: 20 },
            forceReason: { type: 'string' }
          }
        }
      }
    },
    handoverShiftHandler
  );

  app.post(
    '/api/v1/shift/start',
    {
      preHandler: [
        authMiddleware,
        userContextMiddleware,
        roleMiddleware(['CAPTAIN', 'GSA', 'CASHIER', 'KITCHEN', 'OUTLET_MANAGER', 'ARM'])
      ],
      schema: {
        body: {
          type: 'object',
          required: ['outletId', 'roleId'],
          properties: {
            outletId: { type: 'string', minLength: 1 },
            roleId: { type: 'string', enum: ['CAPTAIN', 'GSA', 'CASHIER', 'KITCHEN'] },
            cashStartingAmount: { type: 'number', minimum: 0 }
          }
        }
      }
    },
    startShiftHandler
  );

  app.get('/api/v1/shift/active', {
    preHandler: [authMiddleware, userContextMiddleware],
    schema: { /* optional */ }
  }, getActiveShiftHandler);

  app.post('/api/v1/shift/end', {
    preHandler: [authMiddleware, userContextMiddleware]
  }, endShiftHandler);
}

module.exports = shiftRoutes;