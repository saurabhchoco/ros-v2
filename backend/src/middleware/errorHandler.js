function errorHandler(error, request, reply) {
  console.error(error);

  reply.status(500).send({
    success: false,
    message: 'Internal server error'
  });
}

module.exports = errorHandler;