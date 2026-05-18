import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

const adminAPI = axios.create({
  baseURL: `${API_BASE_URL}/api/v1/admin`,
  withCredentials: true
});

// Add auth token to requests
adminAPI.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// ── BRANDS ────────────────────────────────

export const brandApi = {
  // Create a new brand with owner
  create: async (brandData) => {
    const { data } = await adminAPI.post('/brands', {
      brandName: brandData.brandName,
      ownerName: brandData.ownerName,
      ownerEmail: brandData.ownerEmail,
      password: brandData.password,
      country: brandData.country || null,
      city: brandData.city || null
    });
    return data.data;
  },

  // List all brands with stats
  getAll: async () => {
    const { data } = await adminAPI.get('/brands');
    return data.data;
  },

  // Get single brand
  getById: async (brandId) => {
    const { data } = await adminAPI.get(`/brands/${brandId}`);
    return data.data;
  },

  // Update brand details
  update: async (brandId, updates) => {
    const { data } = await adminAPI.put(`/brands/${brandId}`, updates);
    return data.data;
  },

  // Deactivate brand
  deactivate: async (brandId) => {
    const { data } = await adminAPI.patch(`/brands/${brandId}/deactivate`);
    return data.data;
  }
};

// ── OUTLETS ───────────────────────────────

export const outletApi = {
  // Create outlet under a brand
  create: async (outletData) => {
    const { data } = await adminAPI.post('/outlets', {
      name: outletData.name,
      organizationId: outletData.organizationId,
      outletType: outletData.outletType || 'RESTAURANT',
      address: outletData.address || null,
      phone: outletData.phone || null
    });
    return data.data;
  },

  // List outlets (all or filtered by brand)
  getAll: async (organizationId = null) => {
    const params = organizationId ? { organizationId } : {};
    const { data } = await adminAPI.get('/outlets', { params });
    return data.data;
  },

  // Get outlets by brand
  getByBrand: async (organizationId) => {
    return outletApi.getAll(organizationId);
  },

  // Get single outlet
  getById: async (outletId) => {
    const { data } = await adminAPI.get(`/outlets/${outletId}`);
    return data.data;
  },

  // Update outlet
  update: async (outletId, updates) => {
    const { data } = await adminAPI.put(`/outlets/${outletId}`, updates);
    return data.data;
  },

  // Deactivate outlet
  deactivate: async (outletId) => {
    const { data } = await adminAPI.patch(`/outlets/${outletId}/deactivate`);
    return data.data;
  }
};

// ── OUTLET MANAGERS ───────────────────────

export const managerApi = {
  // Create outlet manager
  create: async (managerData) => {
    const { data } = await adminAPI.post('/managers', {
      fullName: managerData.fullName,
      email: managerData.email,
      password: managerData.password,
      organizationId: managerData.organizationId,
      outletId: managerData.outletId
    });
    return data.data;
  },

  // List all outlet managers
  getAll: async () => {
    const { data } = await adminAPI.get('/managers');
    return data.data;
  },

  // Get managers by outlet
  getByOutlet: async (outletId) => {
    const { data } = await adminAPI.get('/managers', {
      params: { outletId }
    });
    return data.data;
  },

  // Get single manager
  getById: async (managerId) => {
    const { data } = await adminAPI.get(`/managers/${managerId}`);
    return data.data;
  },

  // Update manager
  update: async (managerId, updates) => {
    const { data } = await adminAPI.put(`/managers/${managerId}`, updates);
    return data.data;
  },

  // Deactivate manager
  deactivate: async (managerId) => {
    const { data } = await adminAPI.patch(`/managers/${managerId}/deactivate`);
    return data.data;
  }
};

// ── USERS ─────────────────────────────────

export const userApi = {
  // List all users or by organization
  getAll: async (organizationId = null) => {
    const params = organizationId ? { organizationId } : {};
    const { data } = await adminAPI.get('/users', { params });
    return data.data;
  },

  // Get users by organization
  getByOrganization: async (organizationId) => {
    return userApi.getAll(organizationId);
  },

  // Get single user
  getById: async (userId) => {
    const { data } = await adminAPI.get(`/users/${userId}`);
    return data.data;
  },

  // Update user
  update: async (userId, updates) => {
    const { data } = await adminAPI.put(`/users/${userId}`, updates);
    return data.data;
  },

  // Deactivate user
  deactivate: async (userId) => {
    const { data } = await adminAPI.patch(`/users/${userId}/deactivate`);
    return data.data;
  },

  // Change user role
  updateRole: async (userId, newRole) => {
    const { data } = await adminAPI.patch(`/users/${userId}/role`, {
      role: newRole
    });
    return data.data;
  }
};

// ── Error Handler ─────────────────────────

adminAPI.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized — clear auth and redirect to login
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Export all as single object for easy access
export const adminApi = {
  brands: brandApi,
  outlets: outletApi,
  managers: managerApi,
  users: userApi
};

export default adminApi;