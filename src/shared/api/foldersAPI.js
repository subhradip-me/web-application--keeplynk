// Folders API
import apiClient from './apiClient';

export const foldersAPI = {
  getAll: async (params = {}) => {
    const response = await apiClient.get('/folders', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await apiClient.get(`/folders/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await apiClient.post('/folders', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await apiClient.put(`/folders/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await apiClient.delete(`/folders/${id}`);
    return response.data;
  },

  getResources: async (id) => {
    const response = await apiClient.get(`/folders/${id}/resources`);
    return response.data;
  }
};
