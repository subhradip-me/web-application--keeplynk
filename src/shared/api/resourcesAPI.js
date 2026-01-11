// Resources API
import apiClient from './apiClient';

export const resourcesAPI = {
  getAll: async (params = {}) => {
    const response = await apiClient.get('/resources', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await apiClient.get(`/resources/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await apiClient.post('/resources', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await apiClient.put(`/resources/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await apiClient.delete(`/resources/${id}`);
    return response.data;
  },

  getUnorganized: async () => {
    const response = await apiClient.get('/resources/unorganized');
    return response.data;
  }
};
