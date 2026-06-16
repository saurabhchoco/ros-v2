export const safeNumber = (val) => {
  if (val === undefined || val === null) return 0;
  const num = typeof val === 'number' ? val : parseFloat(val);
  return isNaN(num) ? 0 : num;
};

export const formatCurrency = (val) => `₹${safeNumber(val).toLocaleString()}`;

export const formatDelta = (current, previous) => {
  if (previous === undefined || previous === null || previous === 0) {
    return { text: 'New', positive: false, neutral: true };
  }
  const change = ((current - previous) / previous) * 100;
  const absChange = Math.abs(change);
  const isPositive = change > 0;
  const isNeutral = change === 0;
  return {
    text: `${isPositive ? '↑' : isNeutral ? '—' : '↓'} ${absChange.toFixed(1)}%`,
    positive: isPositive,
    neutral: isNeutral
  };
};