import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { useAuth } from '@/contexts/AuthContext';

// Create a custom axios instance with default config
const apiClient: AxiosInstance = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
  withCredentials: true, // Important for cookies
  timeout: 30000, // 30 seconds
});

// Request interceptor for API calls
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const { getAccessToken } = useAuth();
    const token = await getAccessToken();
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add security headers
    config.headers['X-Content-Type-Options'] = 'nosniff';
    config.headers['X-Frame-Options'] = 'DENY';
    config.headers['X-XSS-Protection'] = '1; mode=block';
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for API calls
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Add security headers to all responses
    response.headers['X-Content-Type-Options'] = 'nosniff';
    response.headers['X-Frame-Options'] = 'DENY';
    response.headers['X-XSS-Protection'] = '1; mode=block';
    response.headers['Content-Security-Policy'] = "default-src 'self';";
    
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Handle token refresh on 401
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const { refreshToken } = useAuth();
        await refreshToken();
        return apiClient(originalRequest);
      } catch (error) {
        // If refresh fails, redirect to login
        const { logout } = useAuth();
        await logout();
        window.location.href = '/login';
        return Promise.reject(error);
      }
    }
    
    // Handle other errors
    if (error.response?.status === 403) {
      // Forbidden - user doesn't have permission
      window.location.href = '/unauthorized';
    }
    
    return Promise.reject(error);
  }
);

// Add CSRF token to all requests
const getCsrfToken = (): string | null => {
  return document.cookie
    .split('; ')
    .find(row => row.startsWith('XSRF-TOKEN='))
    ?.split('=')[1] || null;
};

// Add CSRF token to outgoing requests
apiClient.interceptors.request.use(config => {
  const token = getCsrfToken();
  if (token) {
    config.headers['X-XSRF-TOKEN'] = token;
  }
  return config;
});

// Rate limiting helper
const rateLimit = <T>(promise: Promise<T>, delay: number): Promise<T> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      promise.then(resolve);
    }, delay);
  });
};

// Secure API methods
export const secureApi = {
  get: <T>(url: string, config?: AxiosRequestConfig): Promise<T> => 
    rateLimit(apiClient.get(url, config), 0),
  
  post: <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => 
    rateLimit(apiClient.post(url, data, config), 0),
    
  put: <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => 
    rateLimit(apiClient.put(url, data, config), 0),
    
  delete: <T>(url: string, config?: AxiosRequestConfig): Promise<T> => 
    rateLimit(apiClient.delete(url, config), 0),
    
  patch: <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => 
    rateLimit(apiClient.patch(url, data, config), 0),
};

export default apiClient;
