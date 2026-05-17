const pool = require('../../config/db');
const generateId = require('../../utils/generateId');

async function createOrganization(data) {
  const id = generateId('org');

  const query = `
    INSERT INTO organizations (
      id,
      name
    )
    VALUES ($1, $2)
    RETURNING *
  `;

  const values = [
    id,
    data.name
  ];

  const result = await pool.query(query, values);

  return result.rows[0];
}

async function listOrganizations() {
  const result = await pool.query(`
    SELECT *
    FROM organizations
    ORDER BY created_at DESC
  `);

  return result.rows;
}

module.exports = {
  createOrganization,
  listOrganizations
};