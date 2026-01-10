import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000/api",
});

export const Login = async (credentials) => {
  try {
    const response = await api.post("/auth/login", credentials);
    if (response.data.success) {
      localStorage.setItem("token", response.data.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.data.user));
      return response.data.data;
    }
    throw new Error(response.data.message || "Login failed");
  } catch (error) {
    throw new Error(error.response?.data?.message || "Login failed");
  }
};

export const Register = async (userInfo) => {
  try {
    const response = await api.post("/auth/register", userInfo);
    if (response.data.success) {
      localStorage.setItem("token", response.data.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.data.user));
      return response.data.data;
    }
    throw new Error(response.data.message || "Registration failed");
  } catch (error) {
    throw new Error(error.response?.data?.message || "Registration failed");
  }
};

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
