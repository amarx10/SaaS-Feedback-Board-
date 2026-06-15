import api from './axios';

export const adminApi = {
  stats: () => api.get('/admin/stats'),
  // Feedback
  allFeedback: (params) => api.get('/admin/feedback', { params }),
  updateStatus: (id, data) => api.put(`/admin/feedback/${id}/status`, data),
  togglePin: (id) => api.put(`/admin/feedback/${id}/pin`),
  deleteFeedback: (id) => api.delete(`/admin/feedback/${id}`),
  // Users
  allUsers: (params) => api.get('/admin/users', { params }),
  toggleUser: (id) => api.put(`/admin/users/${id}/toggle`),
  toggleAdmin: (id) => api.put(`/admin/users/${id}/admin`),
  // Categories
  getCategories: () => api.get('/categories'),
  createCategory: (data) => api.post('/admin/categories', data),
  updateCategory: (id, data) => api.put(`/admin/categories/${id}`, data),
  deleteCategory: (id) => api.delete(`/admin/categories/${id}`),
  // Notify
  sendNotification: (data) => api.post('/admin/notify', data),
};