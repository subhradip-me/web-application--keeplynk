// Organise API
import apiClient from './apiClient';

export const organiseAPI = {
  autoOrganise: async (data) => {
    const response = await apiClient.post('/organise/auto', data);
    return response.data;
  }
};
