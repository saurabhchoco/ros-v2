function calculateHealth(outlet, brandRevenue) {
  const revenue = Number(outlet.revenue || 0);
  const orders = Number(outlet.orders || 0);
  const cancellationRate = Number(
    outlet.cancellation_rate || 0
  );

  let score = 0;

  const revenueShare =
    brandRevenue > 0
      ? (revenue / brandRevenue) * 100
      : 0;

  score += Math.min(revenueShare, 40);

  score += Math.min(orders, 30);

  score += Math.max(0, 20 - cancellationRate);

  score += revenue > 0 ? 10 : 0;

  score = Math.round(score);

  let status = 'Inactive';

  if (score >= 80) status = 'Healthy';
//   else if (score >= 60) status = 'Watch';
  else if (score >= 40) status = 'Attention';

  return {
    score,
    status
  };
}

module.exports = {
  calculateHealth
};