import axios, { AxiosError } from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://161.97.64.152:3000',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('hisp_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const isLoginRequest = error.config?.url?.includes('/auth/login');

    const isForbidden = error.response?.status === 403;
    const isUnauthorized = error.response?.status === 401;

    if ((isUnauthorized || isForbidden) && !isLoginRequest) {
      sessionStorage.removeItem('hisp_token');
      sessionStorage.removeItem('hisp_user');

      window.location.href = '/login';
    }

    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  },
);
