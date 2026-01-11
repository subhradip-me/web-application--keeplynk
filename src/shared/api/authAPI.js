// Authentication API
import apiClient from './apiClient';

export const authAPI = {
  login: async (credentials) => {
    try {
      const response = await apiClient.post("/auth/login", credentials);
      if (response.data.success) {
        localStorage.setItem("token", response.data.data.token);
        localStorage.setItem("user", JSON.stringify(response.data.data.user));
        return response.data.data;
      }
      throw new Error(response.data.message || "Login failed");
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message || "Login failed");
    }
  },

  register: async (userInfo) => {
    try {
      const response = await apiClient.post("/auth/register", userInfo);
      if (response.data.success) {
        localStorage.setItem("token", response.data.data.token);
        localStorage.setItem("user", JSON.stringify(response.data.data.user));
        return response.data.data;
      }
      throw new Error(response.data.message || "Registration failed");
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message || "Registration failed");
    }
  },

  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  }
};
