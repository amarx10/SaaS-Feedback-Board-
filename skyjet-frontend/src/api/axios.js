
import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    Accept: 'application/json',
  },
  withCredentials: true,
  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',
});

const getXsrfToken = () => {
  const match = document.cookie.match(/(^|; )XSRF-TOKEN=([^;]+)/);
  return match ? decodeURIComponent(match[2]) : null;
};

// Attach Bearer token and CSRF header from cookies
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('skyjet_token');
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  const xsrfToken = getXsrfToken();
  if (xsrfToken) {
    config.headers = config.headers || {};
    config.headers['X-XSRF-TOKEN'] = xsrfToken;
  }

  return config;
});

// Handle 401 globally — clear token and redirect
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('skyjet_token');
      localStorage.removeItem('skyjet_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;