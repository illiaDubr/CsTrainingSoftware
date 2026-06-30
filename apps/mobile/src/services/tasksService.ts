import { apiClient } from './apiClient';

export const tasksService = {
  async getTasksByGroup(groupId: number) {
    const { data } = await apiClient.get(`/tasks?groupId=${groupId}`);
    return data.data;
  },

  async getTaskById(taskId: number) {
    const { data } = await apiClient.get(`/tasks/${taskId}`);
    return data.data;
  },

  async updateProgress(taskId: number, status: string, note?: string) {
    const { data } = await apiClient.patch(`/tasks/${taskId}/progress`, { status, note });
    return data.data;
  },

  async createTask(dto: { group_id: number; title: string; description?: string; priority: string; due_date?: string }) {
    const { data } = await apiClient.post('/tasks', dto);
    return data.data;
  },

  async deleteTask(taskId: number) {
    const { data } = await apiClient.delete(`/tasks/${taskId}`);
    return data.data;
  },
};