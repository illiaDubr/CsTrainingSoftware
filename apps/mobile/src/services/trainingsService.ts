import { apiClient } from './apiClient';

export const trainingsService = {
  async getTrainingsByGroup(groupId: number) {
    const { data } = await apiClient.get(`/trainings?groupId=${groupId}`);
    return data.data;
  },

  async createTraining(dto: {
    group_id: number;
    title: string;
    description?: string;
    scheduled_at: string;
    duration_minutes?: number;
  }) {
    const { data } = await apiClient.post('/trainings', dto);
    return data.data;
  },

  async deleteTraining(id: number) {
    const { data } = await apiClient.delete(`/trainings/${id}`);
    return data.data;
  },
};