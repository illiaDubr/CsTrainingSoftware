import { apiClient } from './apiClient';

export const materialsService = {
  async getMaterialsByGroup(groupId: number) {
    const { data } = await apiClient.get(`/materials?groupId=${groupId}`);
    return data.data;
  },

  async createMaterial(dto: {
    group_id: number;
    title: string;
    description?: string;
    external_url?: string;
    type: string;
  }) {
    const { data } = await apiClient.post('/materials', dto);
    return data.data;
  },

  async updateMaterial(id: number, dto: {
    title?: string;
    description?: string;
    external_url?: string;
    type?: string;
  }) {
    const { data } = await apiClient.patch(`/materials/${id}`, dto);
    return data.data;
  },

  async deleteMaterial(id: number) {
    const { data } = await apiClient.delete(`/materials/${id}`);
    return data.data;
  },
};