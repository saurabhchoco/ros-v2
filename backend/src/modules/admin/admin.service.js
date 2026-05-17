const pool =
  require('../../config/db');

const {
  generateId
} = require('../../utils/generateId');

async function createOrganization(
  data
) {

  const organizationId =
    generateId('org');

  const result =
    await pool.query(

      `
      INSERT INTO organizations (

        id,
        name,
        created_at

      )

      VALUES (
        $1,
        $2,
        NOW()
      )

      RETURNING *
      `,

      [

        organizationId,
        data.brandName

      ]

    );

  return result.rows[0];
}

async function createBrandOwner(
  data,
  firebaseUid,
  organizationId
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

        created_at

      )

      VALUES (

        $1,
        $2,

        $3,
        NULL,

        $4,
        $5,

        'BRAND_OWNER',

        NOW()

      )

      RETURNING *
      `,

      [

        userId,
        firebaseUid,

        organizationId,

        data.ownerName,
        data.ownerEmail

      ]

    );

  return result.rows[0];
}

module.exports = {

  createOrganization,
  createBrandOwner

};