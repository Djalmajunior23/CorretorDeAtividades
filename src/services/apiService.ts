import axios from 'axios';

export const getApiBaseUrl = (): string => {
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    if (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname.includes(".run.app")
    ) {
      return "/api";
    }
  }
  return import.meta.env.VITE_API_BASE_URL || "/api";
};

export const API_BASE_URL = getApiBaseUrl();

const apiService = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiService.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

apiService.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized (redirect to login)
      localStorage.removeItem('token');
      window.location.href = '/login';
    } else if (error.message === 'Network Error' || !error.response) {
      console.error('API is offline or unresponsive. Make sure the Python backend is running.');
      // Avoid white screen, maybe dispatch a global event or simply alert
      // In a real app we'd use a toast context.
      if (!window.sessionStorage.getItem('network_error_shown')) {
        alert('O servidor está offline. Por favor, certifique-se de que o backend (uvicorn app.main:app) está rodando localmente.');
        window.sessionStorage.setItem('network_error_shown', 'true');
      }
    }
    return Promise.reject(error);
  }
);

export default apiService;
