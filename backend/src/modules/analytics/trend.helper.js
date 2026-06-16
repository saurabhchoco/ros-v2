function fillMissingDates(startDate, endDate, rows) {
  const map = new Map();

  rows.forEach(r => {
    map.set(
      r.date.toISOString().slice(0, 10),
      Number(r.revenue || 0)
    );
  });

  const result = [];

  const current = new Date(startDate);

  while (current < endDate) {
    const key = current.toISOString().slice(0, 10);

    result.push({
      date: key,
      revenue: map.get(key) || 0
    });

    current.setDate(current.getDate() + 1);
  }

  return result;
}

function fillMissingHours(rows) {
  const map = new Map();

  rows.forEach(r => {
    map.set(Number(r.hour), Number(r.orders || r.order_count || 0));
  });

  return Array.from({ length: 24 }, (_, hour) => ({
    hour,
    orders: map.get(hour) || 0
  }));
}

module.exports = {
  fillMissingDates,
  fillMissingHours
};