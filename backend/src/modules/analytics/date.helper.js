function getDateRange(period = '7d') {
  const now = new Date();

  let startDate;
  let endDate;

  switch (period) {
    case 'today':
      startDate = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
      );

      endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 1);
      break;

    case '30d':
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 29);
      startDate.setHours(0, 0, 0, 0);

      endDate = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1
      );
      break;

    case '7d':
    default:
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 6);
      startDate.setHours(0, 0, 0, 0);

      endDate = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1
      );
      break;
  }

  return {
    startDate,
    endDate
  };
}

module.exports = {
  getDateRange
};