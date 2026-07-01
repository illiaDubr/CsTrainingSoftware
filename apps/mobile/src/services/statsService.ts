import { apiClient } from './apiClient';

export const statsService = {
  async getPlayerActivity(playerId: number) {
    const { data } = await apiClient.get(`/stats/player/${playerId}/activity`);
    return data.data;
  },
};