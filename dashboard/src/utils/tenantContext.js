/**
 * Normalizes tenant IDs from various possible field names
 * @param {Object} outlet - The outlet object from auth store
 * @returns {Object} { organizationId, outletId }
 */
export function getTenantContext(outlet) {
  if (!outlet) {
    return { organizationId: null, outletId: null };
  }

  return {
    organizationId:
      outlet?.organization_id ||
      outlet?.organizationId ||
      outlet?.orgId ||
      null,
    outletId:
      outlet?.outlet_id ||
      outlet?.outletId ||
      outlet?.id ||
      null,
  };
}