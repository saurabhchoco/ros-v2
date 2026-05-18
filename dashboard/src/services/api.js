import axios from 'axios';

const API_URL = 'http://localhost:3000/api/v1';

// Get token from localStorage (set by Firebase auth)
const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

export const apiService = {
  // Orders
  async createOrder(data) {
    return axios.post(`${API_URL}/orders/create`, data, {
      headers: getAuthHeaders()
    });
  },

  async listOrders(filters = {}) {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    
    return axios.get(`${API_URL}/orders?${params}`, {
      headers: getAuthHeaders()
    });
  },

  async getOrder(orderId) {
    return axios.get(`${API_URL}/orders/${orderId}`, {
      headers: getAuthHeaders()
    });
  },

  async updateOrderStatus(orderId, status) {
    return axios.patch(`${API_URL}/orders/${orderId}/status`, 
      { status },
      { headers: getAuthHeaders() }
    );
  },

  // Reports
  async getSummary(date = null) {
    const params = date ? `?date=${date}` : '';
    return axios.get(`${API_URL}/reports/summary${params}`, {
      headers: getAuthHeaders()
    });
  },

  async getByDateRange(startDate, endDate) {
    return axios.get(
      `${API_URL}/reports/by-date?startDate=${startDate}&endDate=${endDate}`,
      { headers: getAuthHeaders() }
    );
  }
};