import { apiClient } from './apiClient';
import { NadeSide, TacticArrow } from '../types';

export const tacticsService = {
  async getTacticsByGroup(groupId: number) {
    const { data } = await apiClient.get(`/tactics?groupId=${groupId}`);
    return data.data;
  },

  async getTacticById(id: number) {
    const { data } = await apiClient.get(`/tactics/${id}`);
    return data.data;
  },

  async createTactic(dto: {
    group_id: number;
    title: string;
    map_name: string;
    side: NadeSide;
    description?: string;
    movement_arrows?: TacticArrow[];
    nade_ids?: number[];
  }) {
    const { data } = await apiClient.post('/tactics', dto);
    return data.data;
  },

  async updateTactic(id: number, dto: Partial<{
    title: string;
    map_name: string;
    side: NadeSide;
    description: string;
    movement_arrows: TacticArrow[];
    nade_ids: number[];
  }>) {
    const { data } = await apiClient.patch(`/tactics/${id}`, dto);
    return data.data;
  },

  async deleteTactic(id: number) {
    const { data } = await apiClient.delete(`/tactics/${id}`);
    return data.data;
  },
};
