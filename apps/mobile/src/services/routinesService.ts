import { apiClient } from './apiClient';

export const routinesService = {
  async getRoutinesByGroup(groupId: number) {
    const { data } = await apiClient.get(`/routines?groupId=${groupId}`);
    return data.data;
  },

  async getMyPersonalRoutines() {
    const { data } = await apiClient.get('/routines/personal');
    return data.data;
  },

  async getPlayerPersonalRoutines(playerId: number) {
    const { data } = await apiClient.get(`/routines/personal/${playerId}`);
    return data.data;
  },

  async createPersonalRoutine(dto: { title: string; description?: string; priority: string }) {
    const { data } = await apiClient.post('/routines/personal', dto);
    return data.data;
  },

  async createRoutine(dto: { group_id: number; title: string; description?: string; priority: string }) {
    const { data } = await apiClient.post('/routines', dto);
    return data.data;
  },

  async updateRoutine(id: number, dto: { title?: string; description?: string; priority?: string }) {
    const { data } = await apiClient.patch(`/routines/${id}`, dto);
    return data.data;
  },

  async deactivateRoutine(id: number) {
    const { data } = await apiClient.delete(`/routines/${id}`);
    return data.data;
  },

  // Тренер проставляет статус игроку за конкретный день (в т.ч. прошлый)
  async overrideProgress(routineId: number, playerId: number, date: string, status: string) {
    const { data } = await apiClient.patch(`/routines/${routineId}/progress/override`, {
      player_id: playerId, date, status,
    });
    return data.data;
  },

  async updateProgress(routineId: number, status: string, note?: string, timeSpentMinutes?: number | null) {
    const { data } = await apiClient.patch(`/routines/${routineId}/progress`, {
      status, note, time_spent_minutes: timeSpentMinutes ?? null,
    });
    return data.data;
  },
};