import axios from 'axios';

const API = axios.create({ baseURL: import.meta.env.VITE_API_URL });

// Add request interceptor to attach token
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default API;

// Keeping fetchAPI for backward compatibility with existing components
export async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  try {
    const method = (options.method || 'GET').toUpperCase();
    const res = await API({
      url: endpoint,
      method,
      data: options.body ? (typeof options.body === 'string' ? JSON.parse(options.body) : options.body) : undefined,
      headers: options.headers as any
    });
    return res.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || `Request failed with status ${error.response?.status}`);
  }
}
