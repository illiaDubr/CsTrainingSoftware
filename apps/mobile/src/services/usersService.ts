import { apiClient } from './apiClient';

export const usersService = {
  async getMe() {
    const { data } = await apiClient.get('/users/me');
    return data.data;
  },

  async updateMe(dto: { username?: string; in_game_role?: string | null; bio?: string | null }) {
    const { data } = await apiClient.patch('/users/me', dto);
    return data.data;
  },

  async searchPlayers(query: string) {
    const { data } = await apiClient.get(`/users/search/players?q=${encodeURIComponent(query)}`);
    return data.data;
  },
};