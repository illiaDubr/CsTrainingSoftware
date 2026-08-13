import { apiClient } from './apiClient';

export const groupsService = {
  async getMyGroups() {
    const { data } = await apiClient.get('/groups');
    return data.data;
  },

  async getGroupById(id: number) {
    const { data } = await apiClient.get(`/groups/${id}`);
    return data.data;
  },

  async createGroup(name: string, description?: string) {
    const { data } = await apiClient.post('/groups', { name, description });
    return data.data;
  },

  async addMember(groupId: number, playerId: number) {
    const { data } = await apiClient.post(`/groups/${groupId}/members`, { playerId });
    return data.data;
  },

  async removeMember(groupId: number, playerId: number) {
    const { data } = await apiClient.delete(`/groups/${groupId}/members/${playerId}`);
    return data.data;
  },

  async setAssistantCoach(groupId: number, playerId: number, isAssistant: boolean) {
    const { data } = await apiClient.patch(`/groups/${groupId}/members/${playerId}/assistant`, {
      is_assistant_coach: isAssistant,
    });
    return data.data;
  },
};