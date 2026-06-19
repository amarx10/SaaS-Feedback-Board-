
import api from './axios';

export const authApi = {
  register: (data) => api.post('/register', data),
  login: (data) => api.post('/login', data),
  logout: () => api.post('/logout'),
  me: () => api.get('/me'),
  updateProfile: (data) => api.put('/me', data),
  uploadAvatar: (formData) => api.post('/me/avatar', formData),
};
