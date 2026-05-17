const pool = require('../config/db');

async function userContextMiddleware(
  request,
  reply
) {

  try {

    const firebaseUid =
      request.user.uid;

    const result =
      await pool.query(
        `
        SELECT *
        FROM users
        WHERE firebase_uid = $1
        LIMIT 1
        `,
        [firebaseUid]
      );

    const user =
      result.rows[0];

    if (!user) {

      return reply.status(401).send({
        success: false,
        message: 'Operational user not found'
      });

    }

    request.userContext = user;

  } catch (error) {

    return reply.status(500).send({
      success: false,
      message: 'User context failed'
    });

  }

}

module.exports =
  userContextMiddleware;