import api from './axios';

export const feedbackApi = {
  getAll: (params) => api.get('/feedback', { params }),
  getOne: (id) => api.get(`/feedback/${id}`),
  getStats: () => api.get('/feedback/stats'),
  create: (data) => api.post('/feedback', data),
  update: (id, data) => api.put(`/feedback/${id}`, data),
  remove: (id) => api.delete(`/feedback/${id}`),
  myFeedback: (params) => api.get('/my-feedback', { params }),
};

