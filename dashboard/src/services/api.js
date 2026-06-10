import axios from 'axios';
import { auth } from '../config/firebase';

const API_URL =
  import.meta.env.VITE_API_URL ||
  '/api/v1';

const getAuthHeaders = async () => {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');
  const token = await user.getIdToken();
  return { 'Authorization': `Bearer ${token}` };
  // No 'Content-Type' header – let Axios set it automatically
};

export const apiService = {

  async getMe() {
    return axios.get(
      `${API_URL}/me`,
      { headers: await getAuthHeaders() }
    );
  },

  async createOrder(data) {
    return axios.post(
      `${API_URL}/orders/create`,
      data,
      { headers: await getAuthHeaders() }
    );
  },

  async listOrders(filters = {}) {
    const params = new URLSearchParams();
    if (filters.status)
      params.append('status', filters.status);
    if (filters.startDate)
      params.append('startDate', filters.startDate);
    if (filters.endDate)
      params.append('endDate', filters.endDate);

    return axios.get(
      `${API_URL}/orders?${params}`,
      { headers: await getAuthHeaders() }
    );
  },

  async getOrder(orderId) {
    return axios.get(
      `${API_URL}/orders/${orderId}`,
      { headers: await getAuthHeaders() }
    );
  },

  async updateOrderStatus(orderId, status, cancellationReason = null) {
    const body = { status };
    if (cancellationReason) body.cancellationReason = cancellationReason;
    return axios.patch(`${API_URL}/orders/${orderId}/status`, body, { headers: await getAuthHeaders() });
  },

  async getSummary(date = null) {
    const params = date ? `?date=${date}` : '';
    return axios.get(
      `${API_URL}/reports/summary${params}`,
      { headers: await getAuthHeaders() }
    );
  },

  async getByDateRange(startDate, endDate) {
    return axios.get(
      `${API_URL}/reports/by-date?startDate=${startDate}&endDate=${endDate}`,
      { headers: await getAuthHeaders() }
    );
  },

  async getCategories(organizationId, outletId, includeCounts = false) {
    let url = `${API_URL}/menu/categories/list?organizationId=${organizationId}&outletId=${outletId}`;
    if (includeCounts) url += `&includeCounts=true`;
    return axios.get(url, { headers: await getAuthHeaders() });
  },

  async getMenuItems(organizationId, outletId, categoryId = null) {
    let url = `${API_URL}/menu/items/list?organizationId=${organizationId}&outletId=${outletId}`;
    if (categoryId) url += `&categoryId=${categoryId}`;
    return axios.get(url, { headers: await getAuthHeaders() });
  },

  async getBrandAnalytics(period = 'week') {
    return axios.get(`${API_URL}/analytics/brand`, {
      params: { period },
      headers: await getAuthHeaders()
    });
  },

  async getOutletAnalytics(outletId, period = 'day') {
    return axios.get(`${API_URL}/outlet/analytics?outletId=${outletId}&period=${period}`, {
      headers: await getAuthHeaders()
    });
  },

  async updateMenuItem(id, data) {
    return axios.put(`${API_URL}/menu/items/${id}`, data, { headers: await getAuthHeaders() });
  },

  async deleteMenuItem(id) {
    return axios.delete(`${API_URL}/menu/items/${id}`, { headers: await getAuthHeaders() });
  },

  // Public methods (no auth headers)
  async getPublicOutlet(outletId) {
    return axios.get(`${API_URL}/public/outlet/${outletId}`);
  },
  async getPublicCategories(organizationId, outletId) {
    return axios.get(`${API_URL}/public/categories?organizationId=${organizationId}&outletId=${outletId}`);
  },
  async getPublicMenuItems(organizationId, outletId, categoryId = null) {
    let url = `${API_URL}/public/items?organizationId=${organizationId}&outletId=${outletId}`;
    if (categoryId) url += `&categoryId=${categoryId}`;
    return axios.get(url);
  },
  async createPublicOrder(data) {
    return axios.post(`${API_URL}/public/orders`, data);
  },

  async vendorAuth(outletId, pin) {
    return axios.post(`${API_URL}/vendor/auth`, { outletId, pin });
  },

  async getKitchenStats(organizationId, outletId) {
    return axios.get(`${API_URL}/kitchen/stats`, {
      headers: await getAuthHeaders(),
      params: { organizationId, outletId } // if needed; but backend uses userContext
    });
  },

  async getRevenueTrend(organizationId) {
    return axios.get(`${API_URL}/brand/revenue-trend`, { headers: await getAuthHeaders(), params: { organizationId } });
  },
  async getOrderStatusDistribution(organizationId) {
    return axios.get(`${API_URL}/brand/order-status`, { headers: await getAuthHeaders(), params: { organizationId } });
  },
  async getOutletComparison(organizationId) {
    return axios.get(`${API_URL}/brand/outlet-comparison`, { headers: await getAuthHeaders(), params: { organizationId } });
  },

  async getDashboardSummary() {
    return axios.get(`${API_URL}/dashboard/summary`, { headers: await getAuthHeaders() });
  },

  // Inventory
  async getInventory() {
    return axios.get(`${API_URL}/inventory`, { headers: await getAuthHeaders() });
  },
  async getInventoryItem(id) {
    return axios.get(`${API_URL}/inventory/${id}`, { headers: await getAuthHeaders() });
  },
  async createInventoryItem(data) {
    return axios.post(`${API_URL}/inventory`, data, { headers: await getAuthHeaders() });
  },
  async updateInventoryItem(id, data) {
    return axios.put(`${API_URL}/inventory/${id}`, data, { headers: await getAuthHeaders() });
  },
  async adjustInventoryStock(id, change, reason, source = 'MANUAL', referenceId = null) {
    return axios.post(`${API_URL}/inventory/${id}/adjust`, { change, reason, source, referenceId }, { headers: await getAuthHeaders() });
  },
  async getInventoryHealth() {
    return axios.get(`${API_URL}/inventory/health`, { headers: await getAuthHeaders() });
  },
  async getLowStockItems() {
    return axios.get(`${API_URL}/inventory/low-stock`, { headers: await getAuthHeaders() });
  },
  async settleOrder(orderId, paymentMethod) {
    return axios.post(`${API_URL}/orders/${orderId}/settle`, { paymentMethod }, { headers: await getAuthHeaders() });
  },

  async listActiveUsers(outletId) {
    return axios.get(`${API_URL}/shift/active-users`, {
      params: { outletId },
      headers: await getAuthHeaders()   // ✅ use the standalone function, not this.getAuthHeaders
    });
  },

  async getExpectedCash(shiftSessionId) {
    return axios.get(`${API_URL}/shift/expected-cash`, {
      params: { shiftSessionId },
      headers: await getAuthHeaders()
    });
  },

  async handoverShift(data) {
    return axios.post(`${API_URL}/shift/handover`, data, {
      headers: await getAuthHeaders()
    });
  },

  async startShift(data) {
    return axios.post(`${API_URL}/shift/start`, data, {
      headers: await getAuthHeaders()
    });
  },

  async getActiveShift() {
    // Optional: fetch current active shift for the user
    return axios.get(`${API_URL}/shift/active`, {
      headers: await getAuthHeaders()
    });
  },

  async endShift() {
    return axios.post(`${API_URL}/shift/end`, {}, { headers: await getAuthHeaders() });
  },

  async getOutletUsers(outletId) {
    return axios.get(`${API_URL}/users/outlet/${outletId}`, {
      headers: await getAuthHeaders()
    });
  },

  async getOutletStaff(outletId) {
    return axios.get(`${API_URL}/users/outlet/${outletId}/staff`, {
      headers: await getAuthHeaders()
    });
  },

  async getOutletStaffKPIs(outletId) {
    return axios.get(`${API_URL}/users/outlet/${outletId}/staff/kpis`, {
      headers: await getAuthHeaders()
    });
  },

  async menuImportDryRun(formData) {
    return axios.post(`${API_URL}/menu/import/dry-run`, formData, {
      headers: await getAuthHeaders()   // getAuthHeaders should NOT include 'Content-Type'
    });
  },

  async menuImportConfirm(formData) {
    return axios.post(`${API_URL}/menu/import/confirm`, formData, {
      headers: await getAuthHeaders()
    });
  },

  async menuExport(outletId) {
    return axios.get(`${API_URL}/menu/export`, {
      params: { outletId },
      responseType: 'blob',
      headers: await getAuthHeaders()
    });
  },

  async menuSample() {
    return axios.get(`${API_URL}/menu/import/sample`, {
      responseType: 'blob',
      headers: await getAuthHeaders()
    });
  },

  async getMenuHealth(outletId) {
    return axios.get(`${API_URL}/menu/health`, {
      params: { outletId },
      headers: await getAuthHeaders()
    });
  },

  batchUpdateMenuItems: async (itemIds, action) => {
    return axios.patch(`${API_URL}/menu/batch`, { itemIds, action }, { headers: await getAuthHeaders() });
  },

  duplicateMenuItem: async (itemId) => {
    return axios.post(`${API_URL}/menu/items/${itemId}/duplicate`, {}, { headers: await getAuthHeaders() });
  },

  createMenuItem: async (data) => {
    return axios.post(`${API_URL}/menu/items/create`, data, { headers: await getAuthHeaders() });
  },
  createCategory: async (data) => {
    return axios.post(`${API_URL}/menu/categories/create`, data, { headers: await getAuthHeaders() });
  },

  copyMenuToOutlet: async (sourceOutletId, targetOutletId) => {
    return axios.post(`${API_URL}/menu/copy-to-outlet`, { sourceOutletId, targetOutletId }, { headers: await getAuthHeaders() });
  },

  async getOrganizationOutlets() {
    return axios.get(`${API_URL}/organization/outlets`, { headers: await getAuthHeaders() });
  },

  updateCategory: async (categoryId, name) => {
    return axios.put(`${API_URL}/menu/categories/${categoryId}`, { name }, { headers: await getAuthHeaders() });
  },

  deleteCategory: async (categoryId, moveToCategoryId) => {
    return axios.delete(`${API_URL}/menu/categories/${categoryId}`, {
      data: { moveToCategoryId },
      headers: await getAuthHeaders()
    });
  },

  mergeCategories: async (sourceId, targetId) => {
    return axios.post(`${API_URL}/menu/categories/merge`, { sourceCategoryId: sourceId, targetCategoryId: targetId }, { headers: await getAuthHeaders() });
  },

  getReportDashboardRange: async (startDate, endDate) => {
    return axios.get(`${API_URL}/reports/dashboard-range`, {
      params: { startDate, endDate },
      headers: await getAuthHeaders()
    });
  },

};