import axios from 'axios';

// Optional: set base URL from environment
// axios.defaults.baseURL = import.meta.env.VITE_API_URL;

// Response interceptor
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log the full error context
    console.error('[API Error]', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
    });
    return Promise.reject(error);
  }
);

export default axios;