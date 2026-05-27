// backend/src/modules/shift/shift.controller.js
const pool = require('../../config/db');
const { generateId } = require('../../utils/generateId');
const { getActiveUsers, getExpectedCash, handoverShift } = require('./shift.service');

async function getActiveUsersHandler(req, reply) {
  const { outletId } = req.query;
  const userRole = req.user?.role;
  if (!['OUTLET_MANAGER', 'ARM', 'GSA', 'CAPTAIN', 'CASHIER', 'KITCHEN'].includes(userRole)) {
    return reply.code(403).send({ error: 'Forbidden' });
  }
  try {
    const users = await getActiveUsers(outletId);
    return reply.send({ success: true, data: users });
  } catch (err) {
    req.log.error(err);
    return reply.code(500).send({ error: 'Failed to fetch active users' });
  }
}

async function getExpectedCashHandler(req, reply) {
  const { shiftSessionId } = req.query;
  const userRole = req.user?.role;
  if (!['OUTLET_MANAGER', 'ARM'].includes(userRole)) {
    return reply.code(403).send({ error: 'Forbidden' });
  }
  try {
    const expected = await getExpectedCash(shiftSessionId);
    return reply.send({ success: true, expected });
  } catch (err) {
    req.log.error(err);
    return reply.code(500).send({ error: 'Failed to calculate expected cash' });
  }
}

async function handoverShiftHandler(req, reply) {
  const {
    outletId,
    fromUserId,
    toUserId,
    cashDeclared,
    notes,
    requestId,
    forceReason
  } = req.body;

  const performedByUserId = req.userContext?.id || req.user?.id;
  const performedByRole = req.userContext?.role || req.user?.role;

  if (!outletId || !fromUserId || !toUserId || !requestId) {
    return reply.code(400).send({ error: 'Missing required fields: outletId, fromUserId, toUserId, requestId' });
  }
  if (fromUserId === toUserId) {
    return reply.code(400).send({ error: 'From user and To user must be different' });
  }

  try {
    const result = await handoverShift({
      outletId,
      fromUserId,
      toUserId,
      cashDeclared: cashDeclared && cashDeclared !== '' ? parseFloat(cashDeclared) : null,
      notes,
      performedByUserId,
      performedByRole,
      requestId,
      forceReason
    });
    return reply.send(result);
  } catch (err) {
    if (err.message.includes('no active shift') || err.message.includes('not found')) {
      return reply.code(400).send({ error: err.message });
    }
    if (err.message.includes('Cannot handover') || err.message.includes('permission')) {
      return reply.code(403).send({ error: err.message });
    }
    if (err.message.includes('exceeds tolerance')) {
      return reply.code(409).send({ error: err.message, requiresForce: true });
    }
    if (err.message.includes('Duplicate handover')) {
      return reply.code(409).send({ error: err.message });
    }
    req.log.error(err);
    return reply.code(500).send({ error: 'Internal server error' });
  }
}

async function startShiftHandler(req, reply) {
  const { outletId, roleId, cashStartingAmount } = req.body;
  const userId = req.userContext?.id || req.user?.id;
  const organizationId = req.userContext?.organization_id || req.user?.organizationId;

  if (!outletId || !roleId) {
    return reply.code(400).send({ error: 'outletId and roleId are required' });
  }
  if (!userId) {
    return reply.code(401).send({ error: 'User ID not found' });
  }
  if (!organizationId) {
    return reply.code(400).send({ error: 'Organization ID missing' });
  }

  // Check existing active shift
  const existing = await pool.query(
    `SELECT id FROM shift_sessions WHERE user_id = $1 AND status = 'ACTIVE'`,
    [userId]
  );
  if (existing.rows.length > 0) {
    return reply.code(400).send({ error: 'User already has an active shift' });
  }

  const shiftId = generateId('ss');
  try {
    await pool.query(
      `INSERT INTO shift_sessions
       (id, organization_id, outlet_id, user_id, role_id, started_at, status, cash_verified)
       VALUES ($1, $2, $3, $4, $5, NOW(), 'ACTIVE', $6)`,
      [shiftId, organizationId, outletId, userId, roleId, cashStartingAmount || null]
    );
    return reply.send({ success: true, shiftId });
  } catch (err) {
    req.log.error(err);
    return reply.code(500).send({ error: 'Failed to start shift', details: err.message });
  }
}

async function getActiveShiftHandler(req, reply) {
  const userId = req.userContext?.id || req.user?.id;
  try {
    const res = await pool.query(
      `SELECT id, started_at, role_id, cash_verified 
       FROM shift_sessions 
       WHERE user_id = $1 AND status = 'ACTIVE'`,
      [userId]
    );
    if (res.rows.length === 0) {
      return reply.send({ success: true, activeShift: null });
    }
    return reply.send({ success: true, activeShift: res.rows[0] });
  } catch (err) {
    req.log.error(err);
    return reply.code(500).send({ error: 'Failed to fetch active shift' });
  }
}

async function endShiftHandler(req, reply) {
  const userId = req.userContext?.id || req.user?.id;
  if (!userId) return reply.code(401).send({ error: 'User ID missing' });

  const result = await pool.query(
    `UPDATE shift_sessions
     SET status = 'ENDED', ended_at = NOW()
     WHERE user_id = $1 AND status = 'ACTIVE'
     RETURNING id, started_at`,
    [userId]
  );
  if (result.rows.length === 0) {
    return reply.code(400).send({ error: 'No active shift found' });
  }
  const endedShift = result.rows[0];
  return reply.send({ success: true, shiftId: endedShift.id, startedAt: endedShift.started_at });
}

module.exports = {
  getActiveUsersHandler,
  getExpectedCashHandler,
  handoverShiftHandler,
  startShiftHandler,
  getActiveShiftHandler,
  endShiftHandler
};