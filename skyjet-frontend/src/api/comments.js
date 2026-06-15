import api from './axios';

export const commentsApi = {
  getAll: (feedbackId) => api.get(`/feedback/${feedbackId}/comments`),
  create: (feedbackId, data) => api.post(`/feedback/${feedbackId}/comments`, data),
  update: (id, data) => api.put(`/comments/${id}`, data),
  remove: (id) => api.delete(`/comments/${id}`),
};