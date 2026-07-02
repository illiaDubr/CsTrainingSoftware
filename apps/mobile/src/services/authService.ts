import * as SecureStore from 'expo-secure-store';
import { apiClient } from './apiClient';
import { storage } from './storage';

export const authService = {
  async login(email: string, password: string) {
    const { data } = await apiClient.post('/auth/login', { email, password });
    const { user, accessToken, refreshToken } = data.data;
    await storage.setItem('access_token', accessToken);
    await storage.setItem('refresh_token', refreshToken);
    return { user, accessToken };
  },

  async register(email: string, username: string, password: string, role: 'player' | 'coach') {
    const { data } = await apiClient.post('/auth/register', { email, username, password, role });
    const { user, accessToken, refreshToken } = data.data;
    await SecureStore.setItemAsync('access_token', accessToken);
    await SecureStore.setItemAsync('refresh_token', refreshToken);
    return { user, accessToken };
  },

  async logout() {
    await storage.removeItem('access_token');
    await storage.removeItem('refresh_token');
  },

  async getStoredToken() {
    return await storage.getItem('access_token');
  },
};