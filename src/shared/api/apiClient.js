// Core API Configuration
import axios from "axios";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000/api",
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request Interceptor
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // Add persona header from URL path
  const currentPath = window.location.pathname;
  let persona = 'genaral'; // Default to genaral
  
  if (currentPath.includes('/genaral/')) {
    persona = 'genaral';
  } else if (currentPath.includes('/student/')) {
    persona = 'student';
  } else if (currentPath.includes('/professional/')) {
    persona = 'professional';
  } else if (currentPath.includes('/researcher/')) {
    persona = 'researcher';
  } else if (currentPath.includes('/creator/')) {
    persona = 'creator';
  } else if (currentPath.includes('/entrepreneur/')) {
    persona = 'entrepreneur';
  }
  
  config.headers['X-Persona'] = persona;
  
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Response Interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear storage and redirect to signin
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/signin';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
