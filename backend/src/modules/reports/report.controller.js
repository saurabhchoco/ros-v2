const reportService =
  require('./report.service');

async function getSummary(
  request,
  reply
) {

  const { date } = request.query;

  const report =
    await reportService.getSummaryReport(
      request.userContext.organization_id,
      request.userContext.outlet_id,
      date
    );

  return reply.send({
    success: true,
    data: report
  });

}

async function getByDateRange(
  request,
  reply
) {

  const { startDate, endDate } =
    request.query;

  if (!startDate || !endDate) {
    return reply.status(400).send({
      success: false,
      message: 'startDate and endDate are required'
    });
  }

  const reports =
    await reportService.getDateRangeReport(
      request.userContext.organization_id,
      request.userContext.outlet_id,
      startDate,
      endDate
    );

  return reply.send({
    success: true,
    data: reports
  });

}

module.exports = {
  getSummary,
  getByDateRange
};