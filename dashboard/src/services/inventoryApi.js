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

  const token =
    await user.getIdToken(true);

  return {
    Authorization: `Bearer ${token}`
  };
};

export const inventoryApi = {

  // ======================
  // Units
  // ======================

  async getUnits() {
    return axios.get(
      `${API_URL}/inventory/units`,
      {
        headers:
          await getAuthHeaders()
      }
    );
  },

  async createUnit(data) {
    return axios.post(
      `${API_URL}/inventory/units`,
      data,
      {
        headers:
          await getAuthHeaders()
      }
    );
  },

  async updateUnit(id, data) {
    return axios.put(
      `${API_URL}/inventory/units/${id}`,
      data,
      {
        headers:
          await getAuthHeaders()
      }
    );
  },

  async deleteUnit(id) {
    return axios.delete(
      `${API_URL}/inventory/units/${id}`,
      {
        headers:
          await getAuthHeaders()
      }
    );
  },

  // ======================
  // Vendors
  // ======================

  async getVendors() {
    return axios.get(
      `${API_URL}/inventory/vendors`,
      {
        headers:
          await getAuthHeaders()
      }
    );
  },

  async createVendor(data) {
    return axios.post(
      `${API_URL}/inventory/vendors`,
      data,
      {
        headers:
          await getAuthHeaders()
      }
    );
  },

  async updateVendor(id, data) {
    return axios.put(
      `${API_URL}/inventory/vendors/${id}`,
      data,
      {
        headers:
          await getAuthHeaders()
      }
    );
  },

  async deleteVendor(id) {
    return axios.delete(
      `${API_URL}/inventory/vendors/${id}`,
      {
        headers:
          await getAuthHeaders()
      }
    );
  },

  // ======================
  // Categories
  // ======================

  async getCategories(outletId) {
    return axios.get(
      `${API_URL}/inventory/categories?outletId=${outletId}`,
      {
        headers:
          await getAuthHeaders()
      }
    );
  },

  async createCategory(data) {
    return axios.post(
      `${API_URL}/inventory/categories`,
      data,
      {
        headers:
          await getAuthHeaders()
      }
    );
  },

  async updateCategory(id, data) {
    return axios.put(
      `${API_URL}/inventory/categories/${id}`,
      data,
      {
        headers:
          await getAuthHeaders()
      }
    );
  },

  async deleteCategory(id) {
    return axios.delete(
      `${API_URL}/inventory/categories/${id}`,
      {
        headers:
          await getAuthHeaders()
      }
    );
  },

  // ======================
  // Master Items
  // ======================

  async getMasterItems() {
    return axios.get(
      `${API_URL}/inventory/master-items`,
      {
        headers:
          await getAuthHeaders()
      }
    );
  },

  async createMasterItem(data) {
    return axios.post(
      `${API_URL}/inventory/master-items`,
      data,
      {
        headers:
          await getAuthHeaders()
      }
    );
  },

  async updateMasterItem(id, data) {
    return axios.put(
      `${API_URL}/inventory/master-items/${id}`,
      data,
      {
        headers:
          await getAuthHeaders()
      }
    );
  },

  async deleteMasterItem(id) {
    return axios.delete(
      `${API_URL}/inventory/master-items/${id}`,
      {
        headers:
          await getAuthHeaders()
      }
    );
  },

  // ... (existing code for units, vendors, categories, masterItems) ...

  // ======================
  // Item Categories (Mapping)
  // ======================

  async getItemCategories(outletId) {
    return axios.get(
      `${API_URL}/inventory/item-categories?outletId=${outletId}`,
      { headers: await getAuthHeaders() }
    );
  },

  async assignItemCategory(data) {
    return axios.post(
      `${API_URL}/inventory/item-categories`,
      data,
      { headers: await getAuthHeaders() }
    );
  },

  async removeItemCategory(mappingId) {
    return axios.delete(
      `${API_URL}/inventory/item-categories/${mappingId}`,
      { headers: await getAuthHeaders() }
    );
  }
};