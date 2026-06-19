import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    Accept: 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('skyjet_token');

  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {

      localStorage.removeItem('skyjet_token');
      localStorage.removeItem('skyjet_user');

      window.dispatchEvent(new CustomEvent('auth:logout'));
    }

    return Promise.reject(error);
  }
);

export default api;