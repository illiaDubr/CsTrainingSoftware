import { apiClient } from './apiClient';

export const routinesService = {
  async getRoutinesByGroup(groupId: number) {
    const { data } = await apiClient.get(`/routines?groupId=${groupId}`);
    return data.data;
  },

  async createRoutine(dto: { group_id: number; title: string; description?: string; priority: string }) {
    const { data } = await apiClient.post('/routines', dto);
    return data.data;
  },

  async deactivateRoutine(id: number) {
    const { data } = await apiClient.delete(`/routines/${id}`);
    return data.data;
  },

  async updateProgress(routineId: number, status: string, note?: string) {
    const { data } = await apiClient.patch(`/routines/${routineId}/progress`, { status, note });
    return data.data;
  },
};