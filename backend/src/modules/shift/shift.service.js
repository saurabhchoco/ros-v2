// backend/src/modules/shift/shift.service.js
const pool = require('../../config/db');
const { generateId } = require('../../utils/generateId');
const { canHandoverRole } = require('../../utils/roleValidation');
const admin = require('../../config/firebase'); 

async function getActiveUsers(outletId) {
  const res = await pool.query(
    `SELECT u.id, u.full_name, u.role as role_id, ss.id as shift_session_id
     FROM users u
     JOIN shift_sessions ss ON ss.user_id = u.id AND ss.status = 'ACTIVE'
     WHERE u.outlet_id = $1 AND u.status = 'ACTIVE'`,
    [outletId]
  );
  return res.rows;
}

async function getExpectedCash(shiftSessionId) {
  const res = await pool.query(
    `SELECT COALESCE(SUM(grand_total), 0) AS expected
     FROM orders
     WHERE shift_session_id = $1
       AND payment_method = 'CASH'
       AND payment_status = 'PAID'`,
    [shiftSessionId]
  );
  return parseFloat(res.rows[0].expected);
}

async function handoverShift({
  outletId,
  fromUserId,
  toUserId,
  cashDeclared,
  notes,
  performedByUserId,
  performedByRole,
  requestId,
  forceReason = null
}) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Fetch from_user with active shift and organization_id
    const fromUser = await client.query(
      `SELECT u.role as role_id, ss.id as shift_session_id, ss.cash_verified, ss.organization_id
       FROM users u
       JOIN shift_sessions ss ON ss.user_id = u.id AND ss.status = 'ACTIVE'
       WHERE u.id = $1 AND u.outlet_id = $2`,
      [fromUserId, outletId]
    );
    if (fromUser.rows.length === 0) {
      throw new Error('From user has no active shift');
    }
    const { role_id: fromRole, shift_session_id: shiftSessionId, organization_id: orgId } = fromUser.rows[0];

    // 2. Fetch to_user role and validate active shift
    const toUser = await client.query(
      `SELECT role as role_id FROM users WHERE id = $1 AND outlet_id = $2`,
      [toUserId, outletId]
    );
    if (toUser.rows.length === 0) {
      throw new Error('To user not found in same outlet');
    }
    const toRole = toUser.rows[0].role_id;

    const toActive = await client.query(
      `SELECT id FROM shift_sessions WHERE user_id = $1 AND status = 'ACTIVE'`,
      [toUserId]
    );
    if (toActive.rows.length === 0) {
      throw new Error('Recipient does not have an active shift');
    }

    // 3. Role validation
    if (!canHandoverRole(fromRole, toRole)) {
      throw new Error(`Cannot handover from ${fromRole} to ${toRole}`);
    }

    // 4. Force permission check
    if (forceReason && !['ARM', 'OUTLET_MANAGER'].includes(performedByRole)) {
      throw new Error('Only ARM or Outlet Manager can force a handover');
    }

    // 5. Lock the from-user's shift session (concurrency)
    await client.query(`SELECT id FROM shift_sessions WHERE id = $1 FOR UPDATE`, [shiftSessionId]);

    // 6. Expected cash (if cashier)
    let cashExpected = null;
    if (fromRole === 'CASHIER') {
      const expRes = await client.query(
        `SELECT COALESCE(SUM(grand_total), 0) AS expected
         FROM orders
         WHERE shift_session_id = $1 AND payment_method = 'CASH' AND payment_status = 'PAID'`,
        [shiftSessionId]
      );
      cashExpected = parseFloat(expRes.rows[0].expected);
    }

    // 7. Fetch cash tolerance from organization_settings
    let tolerance = 100; // default
    if (cashExpected !== null && cashDeclared !== null) {
      const tolRes = await client.query(
        `SELECT cash_tolerance_amount FROM organization_settings WHERE organization_id = $1`,
        [orgId]
      );
      tolerance = tolRes.rows[0]?.cash_tolerance_amount || 100;
      const diff = Math.abs(cashDeclared - cashExpected);
      if (diff > tolerance && !forceReason) {
        throw new Error(`Cash difference ₹${diff.toFixed(2)} exceeds tolerance of ₹${tolerance}. Use force if approved.`);
      }
    }

    // 8. Reassign open orders (NEW, PREPARING, READY)
    const updateResult = await client.query(
      `UPDATE orders
       SET assigned_to_user_id = $1, updated_at = NOW()
       WHERE outlet_id = $2 AND assigned_to_user_id = $3
         AND order_status IN ('NEW', 'PREPARING', 'READY')
       RETURNING id`,
      [toUserId, outletId, fromUserId]
    );
    const reassignedCount = updateResult.rowCount;

    // 9. Close from-user shift session
    const handoverStatus = forceReason ? 'FORCE_CLOSED' : 'HANDED_OVER';
    await client.query(
      `UPDATE shift_sessions
       SET ended_at = NOW(), status = $1, handover_to_user_id = $2,
           cash_declared = COALESCE($3, cash_declared),
           force_closed = $4, force_close_reason = $5
       WHERE id = $6`,
      [handoverStatus, toUserId, cashDeclared, !!forceReason, forceReason, shiftSessionId]
    );

    // 10. Insert handover audit record with request_id
    const handoverId = generateId('ho');
    const cashDifference = (cashDeclared && cashExpected) ? (cashDeclared - cashExpected) : null;
    await client.query(
      `INSERT INTO shift_handovers
       (id, organization_id, outlet_id, from_user_id, to_user_id,
        from_role_id, to_role_id, reassigned_orders,
        cash_expected, cash_declared, cash_difference, notes, status, created_by, request_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
      [
        handoverId, orgId, outletId, fromUserId, toUserId,
        fromRole, toRole, reassignedCount,
        cashExpected, cashDeclared, cashDifference, notes,
        forceReason ? 'FORCED' : 'COMPLETED', performedByUserId, requestId
      ]
    );

    await client.query('COMMIT');
    const toUserName = (await client.query(`SELECT full_name FROM users WHERE id = $1`, [toUserId])).rows[0].full_name;
    
    // Get from user's full name
    const fromUserRes = await client.query(`SELECT full_name FROM users WHERE id = $1`, [fromUserId]);
    const fromUserName = fromUserRes.rows[0]?.full_name || 'Unknown';

    // Count open orders (NEW, PREPARING) for the to_user
    const openOrdersRes = await client.query(
      `SELECT COUNT(*) FROM orders WHERE assigned_to_user_id = $1 AND order_status IN ('NEW', 'PREPARING')`,
      [toUserId]
    );
    const openOrdersCount = parseInt(openOrdersRes.rows[0].count);

    const readyOrdersRes = await client.query(
      `SELECT COUNT(*) FROM orders WHERE assigned_to_user_id = $1 AND order_status = 'READY'`,
      [toUserId]
    );
    const readyOrdersCount = parseInt(readyOrdersRes.rows[0].count);

    // Write notification to Firestore
    await admin.firestore().collection('user_notifications').doc(`${toUserId}_${Date.now()}`).set({
      userId: toUserId,
      type: 'SHIFT_RECEIVED',
      fromUserName: fromUserName,
      transferredOrdersCount: reassignedCount,
      openOrders: openOrdersCount,
      readyOrders: readyOrdersCount,
      timestamp: new Date().toISOString(),
      read: false
    });
    
    // Update each reassigned order in Firestore
    for (const orderIdRow of updateResult.rows) {
      await admin.firestore().collection('active_orders').doc(orderIdRow.id).update({
        assigned_to_user_id: toUserId,
        assigned_to_name: toUserName
      }).catch(err => console.error('Firestore update failed for order', orderIdRow.id, err));
    }
    return {
      success: true,
      reassignedCount,
      cashExpected,
      cashDeclared,
      cashDifference,
      handoverId
    };
  } catch (err) {
    await client.query('ROLLBACK');
    if (err.code === '23505') { // unique violation (request_id)
      throw new Error('Duplicate handover request – already processed');
    }
    throw err;
  } finally {
    client.release();
  }
}

async function getActiveShiftForUser(userId) {
  const res = await pool.query(
    `SELECT id FROM shift_sessions WHERE user_id = $1 AND status = 'ACTIVE'`,
    [userId]
  );
  return res.rows[0] || null;
}

module.exports = { getActiveUsers, getExpectedCash, handoverShift, getActiveShiftForUser };