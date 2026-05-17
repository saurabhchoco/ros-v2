const pool = require('../../config/db');

const {
  generateId
} = require('../../utils/generateId');

async function createOutlet(data) {

  const id = generateId('out');

  const query = `
    INSERT INTO outlets (
      id,
      organization_id,
      name,
      outlet_type,
      status,
      created_at,
      updated_at
    )
    VALUES (

        $1,
        $2,
        $3,
        $4,
        'ACTIVE',
        NOW(),
        NOW()

      )
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

async function createOutletManager(

  data,
  firebaseUid

) {

  const userId =
    generateId('usr');

  const result =
    await pool.query(

      `
      INSERT INTO users (

        id,
        firebase_uid,

        organization_id,
        outlet_id,

        full_name,
        email,

        role,
        status,

        created_at,
        updated_at

      )

      VALUES (

        $1,
        $2,

        $3,
        $4,

        $5,
        $6,

        'OUTLET_MANAGER',
        'ACTIVE',

        NOW(),
        NOW()

      )

      RETURNING *
      `,

      [

        userId,
        firebaseUid,

        data.organizationId,
        data.outletId,

        data.fullName,
        data.email

      ]

    );

  return result.rows[0];
}

module.exports = {
  createOutlet,
  listOutlets,
  createOutletManager
};