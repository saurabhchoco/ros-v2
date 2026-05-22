import axios from 'axios';
import { auth } from '../config/firebase';

const API_URL =
  import.meta.env.VITE_API_URL ||
  '/api/v1';

const getAuthHeaders = async () => {
  const user = auth.currentUser;

  if (!user) {
    throw new Error('Not authenticated');
  }

  const token = await user.getIdToken(true);

  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
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

  async updateOrderStatus(orderId, status) {
    return axios.patch(
      `${API_URL}/orders/${orderId}/status`,
      { status },
      { headers: await getAuthHeaders() }
    );
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

  async getCategories(organizationId, outletId) {
    return axios.get(
      `${API_URL}/menu/categories/list?organizationId=${organizationId}&outletId=${outletId}`,
      { headers: await getAuthHeaders() }
    );
  },

  async getMenuItems(organizationId, outletId, categoryId = null) {
    let url = `${API_URL}/menu/items/list?organizationId=${organizationId}&outletId=${outletId}`;
    if (categoryId) url += `&categoryId=${categoryId}`;
    return axios.get(
      url,
      { headers: await getAuthHeaders() }
    );
  },

  async getBrandAnalytics(period = 'day') {
    return axios.get(`${API_URL}/brand/analytics?period=${period}`, {
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
}
};