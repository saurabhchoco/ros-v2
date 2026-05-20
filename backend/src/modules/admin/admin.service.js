const pool =
  require('../../config/db');

const {
  generateId
} = require('../../utils/generateId');

const admin =
  require('../../config/firebase');

// ── Organization ──────────────────────────

async function createOrganization(data) {
  const id = generateId('org');
  const result = await pool.query(
    `
    INSERT INTO organizations (
      id, name, status, created_at, updated_at
    )
    VALUES ($1, $2, 'ACTIVE', NOW(), NOW())
    RETURNING *
    `,
    [id, data.brandName]
  );
  return result.rows[0];
}

async function listOrganizations() {
  const result = await pool.query(
    `
    SELECT
      org.*,
      COUNT(DISTINCT o.id) AS outlet_count,
      COUNT(DISTINCT u.id) AS user_count
    FROM organizations org
    LEFT JOIN outlets o
      ON o.organization_id = org.id
    LEFT JOIN users u
      ON u.organization_id = org.id
    GROUP BY org.id
    ORDER BY org.created_at DESC
    `
  );
  return result.rows;
}

async function getOrganization(orgId) {
  const result = await pool.query(
    `SELECT * FROM organizations WHERE id = $1`,
    [orgId]
  );
  return result.rows[0];
}

// ── Brand Owner ───────────────────────────

async function createBrandOwner(
  data,
  firebaseUid,
  organizationId
) {
  const userId = generateId('usr');
  const result = await pool.query(
    `
    INSERT INTO users (
      id, firebase_uid,
      organization_id, outlet_id,
      full_name, email,
      role, status,
      created_at, updated_at
    )
    VALUES (
      $1, $2, $3, NULL,
      $4, $5,
      'BRAND_OWNER', 'ACTIVE',
      NOW(), NOW()
    )
    RETURNING *
    `,
    [
      userId, firebaseUid,
      organizationId,
      data.ownerName, data.ownerEmail
    ]
  );
  // Claims already set in createFirebaseUser, but ensure they are correct
  await admin.auth().setCustomUserClaims(firebaseUid, {
    organizationId: organizationId,
    role: 'BRAND_OWNER'
  });
  return result.rows[0];
}

// ── Outlet ────────────────────────────────

async function createOutlet(data) {
  const id = generateId('out');
  const result = await pool.query(
    `
    INSERT INTO outlets (
      id, organization_id, name,
      outlet_type, status,
      created_at, updated_at
    )
    VALUES (
      $1, $2, $3,
      $4, 'ACTIVE',
      NOW(), NOW()
    )
    RETURNING *
    `,
    [
      id,
      data.organizationId,
      data.name,
      data.outletType || 'RESTAURANT'
    ]
  );
  return result.rows[0];
}

async function listOutlets(organizationId) {
  const query = organizationId
    ? `
      SELECT
        o.*,
        org.name AS organization_name,
        COUNT(DISTINCT u.id) AS manager_count
      FROM outlets o
      LEFT JOIN organizations org ON org.id = o.organization_id
      LEFT JOIN users u ON u.outlet_id = o.id
      WHERE o.organization_id = $1
      GROUP BY o.id, org.name
      ORDER BY o.created_at DESC
      `
    : `
      SELECT
        o.*,
        org.name AS organization_name,
        COUNT(DISTINCT u.id) AS manager_count
      FROM outlets o
      LEFT JOIN organizations org ON org.id = o.organization_id
      LEFT JOIN users u ON u.outlet_id = o.id
      GROUP BY o.id, org.name
      ORDER BY o.created_at DESC
      `;

  const result = organizationId
    ? await pool.query(query, [organizationId])
    : await pool.query(query);

  return result.rows;
}

// ── Outlet Manager ────────────────────────

async function createOutletManager(
  data,
  firebaseUid
) {
  const userId = generateId('usr');
  const result = await pool.query(
    `
    INSERT INTO users (
      id, firebase_uid,
      organization_id, outlet_id,
      full_name, email,
      role, status,
      created_at, updated_at
    )
    VALUES (
      $1, $2,
      $3, $4,
      $5, $6,
      'OUTLET_MANAGER', 'ACTIVE',
      NOW(), NOW()
    )
    RETURNING *
    `,
    [
      userId, firebaseUid,
      data.organizationId, data.outletId,
      data.fullName, data.email
    ]
  );

    await admin.auth().setCustomUserClaims(firebaseUid, {
    organizationId: data.organizationId,
    outletId: data.outletId,
    role: 'OUTLET_MANAGER'
  });
  return result.rows[0];
}

// ── Users ─────────────────────────────────

async function listUsers(organizationId) {
  const query = organizationId
    ? `
      SELECT
        u.*,
        o.name AS outlet_name,
        org.name AS organization_name
      FROM users u
      LEFT JOIN outlets o ON o.id = u.outlet_id
      LEFT JOIN organizations org ON org.id = u.organization_id
      WHERE u.organization_id = $1
      ORDER BY u.created_at DESC
      `
    : `
      SELECT
        u.*,
        o.name AS outlet_name,
        org.name AS organization_name
      FROM users u
      LEFT JOIN outlets o ON o.id = u.outlet_id
      LEFT JOIN organizations org ON org.id = u.organization_id
      ORDER BY u.created_at DESC
      `;

  const result = organizationId
    ? await pool.query(query, [organizationId])
    : await pool.query(query);

  return result.rows;
}

// ── Firebase user creation helper ─────────

// ── Firebase user creation helper with claims ─────────

async function createFirebaseUser(email, password, displayName, claims = {}) {
  const userRecord = await admin.auth().createUser({
    email,
    password,
    displayName
  });
  
  // Set custom claims if provided
  if (Object.keys(claims).length > 0) {
    await admin.auth().setCustomUserClaims(userRecord.uid, claims);
  }
  
  return userRecord;
}

// ── Function to update claims for existing user ─────────
async function updateUserClaims(firebaseUid, claims) {
  await admin.auth().setCustomUserClaims(firebaseUid, claims);
}

module.exports = {
  createOrganization,
  listOrganizations,
  getOrganization,
  createBrandOwner,
  createOutlet,
  listOutlets,
  createOutletManager,
  listUsers,
  createFirebaseUser,
  updateUserClaims
};