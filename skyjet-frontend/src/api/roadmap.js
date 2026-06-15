import api from './axios';

export const roadmapApi = {
  get: () => api.get('/roadmap'),
};
