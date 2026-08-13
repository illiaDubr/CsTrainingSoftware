import { apiClient } from './apiClient';

export interface MapOfDay {
  id: number;
  group_id: number;
  coach_id: number;
  coach_username?: string;
  map_name: string;
  start_date: string; // YYYY-MM-DD
  end_date: string;   // YYYY-MM-DD
}

export const mapsService = {
  async getActiveMap(groupId: number): Promise<MapOfDay | null> {
    const { data } = await apiClient.get(`/maps/current?groupId=${groupId}`);
    return data.data;
  },

  async createMap(dto: { group_id: number; map_name: string; start_date: string; end_date: string }): Promise<MapOfDay> {
    const { data } = await apiClient.post('/maps', dto);
    return data.data;
  },

  async deleteMap(id: number) {
    const { data } = await apiClient.delete(`/maps/${id}`);
    return data.data;
  },
};
