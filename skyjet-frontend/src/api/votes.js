import api from './axios';

export const votesApi = {
  toggle: (feedbackId, type = 'up') => api.post(`/feedback/${feedbackId}/vote`, { type }),
  voted: () => api.get('/voted-feedback'),
};