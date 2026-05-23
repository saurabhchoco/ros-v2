const reportService = require('./report.service');

async function getSummary(request, reply) {
  const { date } = request.query;
  const report = await reportService.getSummaryReport(
    request.userContext.organization_id,
    request.userContext.outlet_id,
    date
  );
  return reply.send({ success: true, data: report });
}

async function getByDateRange(request, reply) {
  const { startDate, endDate } = request.query;
  if (!startDate || !endDate) {
    return reply.status(400).send({ success: false, message: 'startDate and endDate are required' });
  }
  const reports = await reportService.getDateRangeReport(
    request.userContext.organization_id,
    request.userContext.outlet_id,
    startDate,
    endDate
  );
  return reply.send({ success: true, data: reports });
}

// NEW: Brand Owner aggregated analytics
async function getBrandAnalytics(request, reply) {
  const { period = 'day' } = request.query;
  const organizationId = request.userContext.organization_id;
  if (!organizationId) {
    return reply.status(400).send({ success: false, message: 'No organization associated' });
  }
  try {
    const analytics = await reportService.getBrandAnalytics(organizationId, period);
    return reply.send({ success: true, data: analytics });
  } catch (err) {
    console.error(err);
    return reply.status(500).send({ success: false, message: 'Failed to fetch analytics' });
  }
}

// NEW: Per‑outlet analytics
async function getOutletAnalytics(request, reply) {
  const { outletId, period = 'day' } = request.query;
  const organizationId = request.userContext.organization_id;
  if (!outletId || !organizationId) {
    return reply.status(400).send({ success: false, message: 'Missing outletId or organization' });
  }
  try {
    const analytics = await reportService.getOutletAnalytics(outletId, organizationId, period);
    return reply.send({ success: true, data: analytics });
  } catch (err) {
    console.error(err);
    return reply.status(500).send({ success: false, message: 'Failed to fetch outlet analytics' });
  }
}

async function getKitchenStats(request, reply) {
  const { organization_id, outlet_id } = request.userContext;
  if (!outlet_id) {
    return reply.status(400).send({ success: false, message: 'No outlet assigned' });
  }
  const stats = await reportService.getKitchenStats(organization_id, outlet_id);
  return reply.send({ success: true, data: stats });
}

async function getRevenueTrend(request, reply) {
  const { organization_id } = request.userContext;
  const data = await reportService.getRevenueTrend(organization_id);
  return reply.send({ success: true, data });
}

async function getOrderStatusDistribution(request, reply) {
  const { organization_id } = request.userContext;
  const data = await reportService.getOrderStatusDistribution(organization_id);
  return reply.send({ success: true, data });
}

async function getOutletComparison(request, reply) {
  const { organization_id } = request.userContext;
  const data = await reportService.getOutletComparison(organization_id);
  return reply.send({ success: true, data });
}

module.exports = {
  getSummary,
  getByDateRange,
  getBrandAnalytics,
  getOutletAnalytics,
  getKitchenStats,
  getRevenueTrend,
  getOrderStatusDistribution,
  getOutletComparison
};