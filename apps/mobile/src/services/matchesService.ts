import { apiClient } from './apiClient';
import { MatchClass } from '../types';

export const matchesService = {
  async getMatchesByGroup(groupId: number) {
    const { data } = await apiClient.get(`/matches?groupId=${groupId}`);
    return data.data;
  },

  async getMatchById(id: number) {
    const { data } = await apiClient.get(`/matches/${id}`);
    return data.data;
  },

  async createMatch(dto: {
    group_id: number;
    match_class: MatchClass;
    opponent: string;
    scheduled_at: string;
    note?: string;
  }) {
    const { data } = await apiClient.post('/matches', dto);
    return data.data;
  },

  async updateMatch(id: number, dto: Partial<{
    match_class: MatchClass;
    opponent: string;
    scheduled_at: string;
    note: string;
  }>) {
    const { data } = await apiClient.patch(`/matches/${id}`, dto);
    return data.data;
  },

  async deleteMatch(id: number) {
    const { data } = await apiClient.delete(`/matches/${id}`);
    return data.data;
  },
};
