import axios from 'axios';

export const getApiBaseUrl = (): string => {
  return import.meta.env.VITE_API_BASE_URL || "http://31.97.41.64:8080";
};

export const API_BASE_URL = getApiBaseUrl();

const apiService = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
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
      console.error('Servidor da plataforma inacessível no momento.');
      if (!window.sessionStorage.getItem('network_error_shown')) {
        alert('O servidor está offline ou respondendo de forma lenta. Verifique sua conexão e recarregue a página.');
        window.sessionStorage.setItem('network_error_shown', 'true');
      }
    }
    return Promise.reject(error);
  }
);

export default apiService;
