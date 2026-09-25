import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/store/auth.store';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api/v1',
  timeout: 20_000,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token && typeof token === 'string' && token !== 'null' && token !== 'undefined' && token.trim() !== '') {
    config.headers.Authorization = `Bearer ${token.trim()}`;
  }
  return config;
});

type RetryConfig = InternalAxiosRequestConfig & { _retry?: boolean };

let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  try {
    const { data } = await axios.post(
      `${api.defaults.baseURL}/auth/refresh`,
      {},
      { timeout: 20_000, withCredentials: true, headers: { 'Content-Type': 'application/json' } }
    );

    const accessToken = data?.data?.accessToken as string | undefined;
    if (!accessToken) throw new Error('Invalid refresh response');
    useAuthStore.getState().setTokens(accessToken);
    return accessToken;
  } catch (err) {
    useAuthStore.getState().logout();
    throw err;
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetryConfig | undefined;

    // Do not attempt to refresh if:
    // 1. Not a 401
    // 2. Request was already retried
    // 3. Request was to /auth/login, /auth/refresh, or /auth/register
    const isAuthEndpoint =
      original?.url?.includes('/auth/refresh') ||
      original?.url?.includes('/auth/login') ||
      original?.url?.includes('/auth/register');

    if (error.response?.status !== 401 || !original || original._retry || isAuthEndpoint) {
      if (isAuthEndpoint && error.response?.status === 401) {
        useAuthStore.getState().logout();
      }
      return Promise.reject(error);
    }

    original._retry = true;

    try {
      if (!refreshPromise) {
        refreshPromise = refreshAccessToken().finally(() => {
          refreshPromise = null;
        });
      }

      const accessToken = await refreshPromise;
      if (original.headers) {
        if (typeof (original.headers as any).set === 'function') {
          (original.headers as any).set('Authorization', `Bearer ${accessToken}`);
        } else {
          (original.headers as any).Authorization = `Bearer ${accessToken}`;
        }
      }
      return api(original);
    } catch (refreshError) {
      useAuthStore.getState().logout();
      return Promise.reject(refreshError);
    }
  }
);

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors: { code: string; message: string; field?: string }[];
  meta: Record<string, unknown>;
}
