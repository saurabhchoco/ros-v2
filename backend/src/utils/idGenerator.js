// Simple ID generator using timestamp + random string
function generateId(prefix = '') {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  const id = `${timestamp}${random}`;
  return prefix ? `${prefix}_${id}` : id;
}

module.exports = { generateId };