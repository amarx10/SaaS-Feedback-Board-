
import api from './axios';
import axios from 'axios';

const csrfClient = axios.create({
  baseURL: '',
  withCredentials: true,
  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',
});

export const authApi = {
  csrfCookie: () => csrfClient.get('/sanctum/csrf-cookie'),
  register: (data) => api.post('/register', data),
  login: (data) => api.post('/login', data),
  logout: () => api.post('/logout'),
  me: () => api.get('/me'),
  updateProfile: (data) => api.put('/me', data),
  uploadAvatar: (formData) => api.post('/me/avatar', formData),
};
