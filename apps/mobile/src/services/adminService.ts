import { apiClient } from './apiClient';
import {
  AdminOverview, AdminUser, AdminUserDetail, AdminGroup, AdminGroupDetail,
  AdminNadeItem, AdminTacticItem, AdminMaterialItem, AdminTrainingItem, AdminMatchItem,
} from '../types';

export interface AdminUserFilters {
  role?: 'admin' | 'coach' | 'player';
  status?: 'active' | 'banned';
  q?: string;
}

export interface AdminContentFilters {
  map?: string;
  groupId?: number;
  q?: string;
}

const qs = (params: object) => {
  const parts = Object.entries(params as Record<string, unknown>)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
  return parts.length ? `?${parts.join('&')}` : '';
};

export const adminService = {
  async getOverview(): Promise<AdminOverview> {
    const { data } = await apiClient.get('/admin/overview');
    return data.data;
  },

  // Пользователи
  async getUsers(filters: AdminUserFilters = {}): Promise<AdminUser[]> {
    const { data } = await apiClient.get(`/admin/users${qs(filters)}`);
    return data.data;
  },
  async getUserDetail(id: number): Promise<AdminUserDetail> {
    const { data } = await apiClient.get(`/admin/users/${id}`);
    return data.data;
  },
  async updateUser(id: number, dto: Partial<{
    username: string; full_name: string | null; in_game_role: string | null; bio: string | null;
    role: string; is_active: boolean; password: string;
  }>): Promise<AdminUser> {
    const { data } = await apiClient.patch(`/admin/users/${id}`, dto);
    return data.data;
  },

  // Группы
  async getGroups(): Promise<AdminGroup[]> {
    const { data } = await apiClient.get('/admin/groups');
    return data.data;
  },
  async getCoaches(): Promise<{ id: number; username: string; email: string }[]> {
    const { data } = await apiClient.get('/admin/coaches');
    return data.data;
  },
  async getGroupDetail(id: number): Promise<AdminGroupDetail> {
    const { data } = await apiClient.get(`/admin/groups/${id}`);
    return data.data;
  },
  async updateGroup(id: number, dto: Partial<{ name: string; description: string | null; coach_id: number }>) {
    const { data } = await apiClient.patch(`/admin/groups/${id}`, dto);
    return data.data;
  },
  async deleteGroup(id: number) {
    const { data } = await apiClient.delete(`/admin/groups/${id}`);
    return data.data;
  },
  async removeMember(groupId: number, playerId: number) {
    const { data } = await apiClient.delete(`/admin/groups/${groupId}/members/${playerId}`);
    return data.data;
  },
  async setAssistantCoach(groupId: number, playerId: number, isAssistant: boolean) {
    const { data } = await apiClient.patch(`/admin/groups/${groupId}/members/${playerId}/assistant`, {
      is_assistant_coach: isAssistant,
    });
    return data.data;
  },

  // Контент
  async getNades(filters: AdminContentFilters = {}): Promise<AdminNadeItem[]> {
    const { data } = await apiClient.get(`/admin/nades${qs(filters)}`);
    return data.data;
  },
  async deleteNade(id: number) {
    const { data } = await apiClient.delete(`/admin/nades/${id}`);
    return data.data;
  },
  async getTactics(filters: AdminContentFilters = {}): Promise<AdminTacticItem[]> {
    const { data } = await apiClient.get(`/admin/tactics${qs(filters)}`);
    return data.data;
  },
  async deleteTactic(id: number) {
    const { data } = await apiClient.delete(`/admin/tactics/${id}`);
    return data.data;
  },
  async getMaterials(filters: AdminContentFilters = {}): Promise<AdminMaterialItem[]> {
    const { data } = await apiClient.get(`/admin/materials${qs(filters)}`);
    return data.data;
  },
  async deleteMaterial(id: number) {
    const { data } = await apiClient.delete(`/admin/materials/${id}`);
    return data.data;
  },
  async getTrainings(filters: AdminContentFilters = {}): Promise<AdminTrainingItem[]> {
    const { data } = await apiClient.get(`/admin/trainings${qs(filters)}`);
    return data.data;
  },
  async deleteTraining(id: number) {
    const { data } = await apiClient.delete(`/admin/trainings/${id}`);
    return data.data;
  },
  async getMatches(filters: AdminContentFilters = {}): Promise<AdminMatchItem[]> {
    const { data } = await apiClient.get(`/admin/matches${qs(filters)}`);
    return data.data;
  },
  async deleteMatch(id: number) {
    const { data } = await apiClient.delete(`/admin/matches/${id}`);
    return data.data;
  },
};
