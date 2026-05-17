const pool = require('../../config/db');

const generateId = require('../../utils/generateId');

async function createOutlet(data) {

  const id = generateId('out');

  const query = `
    INSERT INTO outlets (
      id,
      organization_id,
      name,
      outlet_type
    )
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `;

  const values = [
    id,
    data.organizationId,
    data.name,
    data.outletType
  ];

  const result = await pool.query(query, values);

  return result.rows[0];
}

async function listOutlets() {

  const result = await pool.query(`
    SELECT *
    FROM outlets
    ORDER BY created_at DESC
  `);

  return result.rows;
}

module.exports = {
  createOutlet,
  listOutlets
};