// utils/roleValidation.js
const ROLE_HANDOVER_MATRIX = {
  CAPTAIN: ['CAPTAIN', 'GSA', 'ARM', 'OUTLET_MANAGER'],
  GSA: ['GSA', 'ARM', 'OUTLET_MANAGER', 'CASHIER'],
  CASHIER: ['CASHIER', 'ARM', 'OUTLET_MANAGER', 'GSA'],
  KITCHEN: ['KITCHEN', 'ARM', 'OUTLET_MANAGER']
};

function canHandoverRole(fromRole, toRole) {
  const allowed = ROLE_HANDOVER_MATRIX[fromRole];
  if (!allowed) return false;
  return allowed.includes(toRole);
}

module.exports = { canHandoverRole };