const { v4: uuidv4 } = require('uuid');

function generateId(
  prefix
) {

  return `${prefix}_${Math.random()
    .toString(16)
    .slice(2, 12)}`;
}

module.exports = {
  generateId
};