import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const rawBaseUrl = process.env.NEXT_PUBLIC_ADMIN_API_URL || 'http://3.139.87.160:8000/api/v1';

const normalizeBaseUrl = (url: string) => {
  const cleaned = url.trim().replace(/\/+$/, '');
  return cleaned.endsWith('/api/v1') ? cleaned : `${cleaned}/api/v1`;
};

const API_BASE_URL = normalizeBaseUrl(rawBaseUrl);

export const adminApiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
  },
  withCredentials: false,
});

// Request Interceptor: Injects token and current active store
adminApiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('admin_token');
      const storeCode = localStorage.getItem('active_store_code');

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      // Include store code for all store-scoped routes (exclude global auth and global media upload)
      const url = config.url || '';
      const isGlobalAuth = url.includes('/admin/auth/');
      const isMediaUpload = url.includes('/admin/media/upload');

      if (storeCode && !isGlobalAuth && !isMediaUpload) {
        config.headers['X-Store-Code'] = storeCode;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Centralized 401 & 403 handling
adminApiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ success?: boolean; error?: { code?: string; message?: string; details?: any } }>) => {
    if (typeof window !== 'undefined' && error.response) {
      const status = error.response.status;
      const errorCode = error.response.data?.error?.code;

      // Handle unauthenticated or token expiration
      if ((status === 401 || errorCode === 'INVALID_CREDENTIALS') && !window.location.pathname.includes('/login')) {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
        localStorage.removeItem('admin_stores');
        localStorage.removeItem('active_store_code');
        window.location.href = '/login';
      }

      // Handle deactivated account
      if (status === 403 && errorCode === 'ACCOUNT_INACTIVE') {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('active_store_code');
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login?error=inactive';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default adminApiClient;
