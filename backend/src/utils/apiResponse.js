function successResponse(
  data = null,
  message = 'Success'
) {

  return {
    success: true,
    message,
    data
  };

}

function errorResponse(
  message = 'Error'
) {

  return {
    success: false,
    message
  };

}

module.exports = {
  successResponse,
  errorResponse
};