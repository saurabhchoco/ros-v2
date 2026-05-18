const pool = require('../../config/db');

// const generateId = require('../../utils/generateId');
const {
  generateId
} = require('../../utils/generateId');

async function createUser(data) {

  const id = generateId('usr');

  const query = `
    INSERT INTO users (
      id,
      firebase_uid,
      organization_id,
      outlet_id,
      full_name,
      email,
      role
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *
  `;

  const values = [
    id,
    data.firebaseUid,
    data.organizationId,
    data.outletId || null,
    data.fullName,
    data.email,
    data.role
  ];

  const result = await pool.query(query, values);

  return result.rows[0];
}

async function listUsers() {

  const result = await pool.query(`
    SELECT *
    FROM users
    ORDER BY created_at DESC
  `);

  return result.rows;
}

async function getUserByFirebaseUid(firebaseUid) {
  const result = await pool.query(
    `
    SELECT
      u.id,
      u.firebase_uid,
      u.organization_id,
      u.outlet_id,
      u.full_name,
      u.email,
      u.role,
      u.created_at,
      o.name AS outlet_name,
      o.outlet_type,
      org.name AS organization_name
    FROM users u
    LEFT JOIN outlets o
      ON o.id = u.outlet_id
    LEFT JOIN organizations org
      ON org.id = u.organization_id
    WHERE u.firebase_uid = $1
    LIMIT 1
    `,
    [firebaseUid]
  );
  return result.rows[0];
}

module.exports = {
  createUser,
  listUsers,
  getUserByFirebaseUid
};