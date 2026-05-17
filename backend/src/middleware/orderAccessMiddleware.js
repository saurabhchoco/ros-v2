function orderAccessMiddleware(
  request,
  reply,
  done
) {

  const user =
    request.userContext;

  const body =
    request.body;

  if (
    user.organization_id !==
    body.organizationId
  ) {

    return reply.status(403).send({
      success: false,
      message:
        'Organization access denied'
    });

  }

  if (
    user.outlet_id &&
    user.outlet_id !== body.outletId
  ) {

    return reply.status(403).send({
      success: false,
      message:
        'Outlet access denied'
    });

  }

  done();
}

module.exports =
  orderAccessMiddleware;