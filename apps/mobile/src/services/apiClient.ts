import axios from 'axios';
import { API_URL } from '../constants';
import { storage } from './storage';

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

apiClient.interceptors.request.use(async (config) => {
  const token = await storage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refreshToken = await storage.getItem('refresh_token');
        const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
        await storage.setItem('access_token', data.data.accessToken);
        original.headers.Authorization = `Bearer ${data.data.accessToken}`;
        return apiClient(original);
      } catch {
        await storage.removeItem('access_token');
        await storage.removeItem('refresh_token');
      }
    }
    return Promise.reject(error);
  }
);