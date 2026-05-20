const admin = require('../config/firebase');
const pool = require('../config/db');

async function syncClaims(request, reply) {
  try {
    const firebaseUid = request.user.uid;
    
    const result = await pool.query(
      `SELECT organization_id, outlet_id, role FROM users WHERE firebase_uid = $1`,
      [firebaseUid]
    );
    
    if (result.rows[0]) {
      const { organization_id, outlet_id, role } = result.rows[0];
      await admin.auth().setCustomUserClaims(firebaseUid, {
        organizationId: organization_id,
        outletId: outlet_id || null,
        role: role
      });
    }
  } catch (error) {
    console.error('Failed to sync custom claims:', error);
  }
}

module.exports = syncClaims;