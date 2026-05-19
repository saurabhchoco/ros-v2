import axios from 'axios';
import { auth } from '../config/firebase';

const API_URL =
  import.meta.env.VITE_API_URL || '/api/v1';

const getAuthHeaders = async () => {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');
  const token = await user.getIdToken(true);
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

export const adminApi = {

  // Brands
  async listBrands() {
    return axios.get(
      `${API_URL}/admin/brands`,
      { headers: await getAuthHeaders() }
    );
  },

  async createBrand(data) {
    return axios.post(
      `${API_URL}/admin/brands`,
      data,
      { headers: await getAuthHeaders() }
    );
  },

  // Outlets
  async listOutlets(organizationId = null, isBrandOwner = false) {
    const endpoint = isBrandOwner 
      ? `${API_URL}/outlets/my`
      : `${API_URL}/admin/outlets`;
    
    const params = !isBrandOwner && organizationId
      ? `?organizationId=${organizationId}`
      : '';
    
    return axios.get(
      `${endpoint}${params}`,
      { headers: await getAuthHeaders() }
    );
  },

  async createOutlet(data) {
    return axios.post(
      `${API_URL}/admin/outlets`,
      data,
      { headers: await getAuthHeaders() }
    );
  },

  async createOutletAsBrandOwner(data) {
    return axios.post(
      `${API_URL}/outlets`,
      data,
      { headers: await getAuthHeaders() }
    );
  },

  // Managers
  async createManager(data) {
    return axios.post(
      `${API_URL}/admin/managers`,
      data,
      { headers: await getAuthHeaders() }
    );
  },

  // Users
  async listUsers(organizationId = null) {
    const params = organizationId
      ? `?organizationId=${organizationId}`
      : '';
    return axios.get(
      `${API_URL}/admin/users${params}`,
      { headers: await getAuthHeaders() }
    );
  },

  // Menu CSV upload
  async uploadMenuCSV(file, organizationId, outletId) {
    const token = await auth.currentUser.getIdToken(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('organizationId', organizationId);
    formData.append('outletId', outletId);
    return axios.post(
      `${API_URL}/menu/import-csv`,
      formData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      }
    );
  }

};