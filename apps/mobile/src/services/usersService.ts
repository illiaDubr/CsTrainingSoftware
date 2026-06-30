import { apiClient } from './apiClient';

export const usersService = {
  async getMe() {
    const { data } = await apiClient.get('/users/me');
    return data.data;
  },

  async searchPlayers(query: string) {
    const { data } = await apiClient.get(`/users/search/players?q=${encodeURIComponent(query)}`);
    return data.data;
  },
};