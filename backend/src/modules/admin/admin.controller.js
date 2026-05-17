const admin =
  require('../../config/firebase');

const adminService =
  require('./admin.service');

async function createBrand(
  request,
  reply
) {

  try {

    const data =
      request.body;

    const firebaseUser =
      await admin.auth()
        .createUser({

          email:
            data.ownerEmail,

          password:
            data.password,

          displayName:
            data.ownerName

        });

    const organization =
      await adminService
        .createOrganization(
          data
        );

    const brandOwner =
      await adminService
        .createBrandOwner(

          data,

          firebaseUser.uid,

          organization.id

        );

    return reply.send({

      success: true,

      data: {

        organization,
        brandOwner

      }

    });

  } catch (error) {
    console.log(error);
    return reply.status(500).send({
    success: false,
    message:
        error.message ||
        'Brand creation failed'
    });
  }

}

module.exports = {

  createBrand

};