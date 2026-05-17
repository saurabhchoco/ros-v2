const pool = require('../../config/db');

const generateId =
  require('../../utils/generateId');

async function createAuditLog({
  organizationId,
  outletId,
  userId,
  action,
  entityType,
  entityId,
  oldValue = null,
  newValue = null
}) {

  const id =
    generateId('aud');

  await pool.query(
    `
    INSERT INTO audit_logs (
      id,
      organization_id,
      outlet_id,
      user_id,
      action,
      entity_type,
      entity_id,
      old_value,
      new_value
    )
    VALUES (
      $1,$2,$3,$4,$5,$6,$7,$8,$9
    )
    `,
    [
      id,
      organizationId,
      outletId,
      userId,
      action,
      entityType,
      entityId,
      oldValue,
      newValue
    ]
  );

}

module.exports = {
  createAuditLog
};