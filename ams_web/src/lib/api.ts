import axios, { AxiosError } from 'axios';

export const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ||
    'https://remains-electron-reload-cement.trycloudflare.com',
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
    if (error.response?.status === 401) {
      sessionStorage.removeItem('hisp_token');
      sessionStorage.removeItem('hisp_user');

      window.location.href = '/login';
    }

    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  },
);
