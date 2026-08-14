import { Platform } from 'react-native';
import { apiClient } from './apiClient';
import { API_URL } from '../constants';
import { MapBackground, NadeImageType } from '../types';

const FILES_BASE = API_URL.replace(/\/api$/, '');

/** Полный URL картинки раскидки / фона карты */
export const nadeImageUrl = (path: string) =>
  path.startsWith('http') ? path : `${FILES_BASE}${path}`;

const appendFile = async (form: FormData, field: string, uri: string, i: number) => {
  if (Platform.OS === 'web') {
    const blob = await (await fetch(uri)).blob();
    form.append(field, blob, `${field}-${Date.now()}-${i}.jpg`);
  } else {
    const ext = uri.split('.').pop()?.toLowerCase() || 'jpg';
    form.append(field, {
      uri,
      name: `${field}-${Date.now()}-${i}.${ext}`,
      type: `image/${ext === 'png' ? 'png' : 'jpeg'}`,
    } as any);
  }
};

const appendImages = async (form: FormData, uris: string[]) => {
  for (let i = 0; i < uris.length; i++) {
    await appendFile(form, 'images', uris[i], i);
  }
};

export const nadesService = {
  async getMaps(groupId: number) {
    const { data } = await apiClient.get(`/nades/maps?groupId=${groupId}`);
    return data.data;
  },

  async getNadesByMap(groupId: number, mapName: string) {
    const { data } = await apiClient.get(`/nades?groupId=${groupId}&mapName=${encodeURIComponent(mapName)}`);
    return data.data;
  },

  async createNade(dto: {
    group_id: number;
    map_name: string;
    side: string;
    category: string;
    nade_type: string;
    title: string;
    description?: string;
    video_url?: string;
    pos_x?: number;
    pos_y?: number;
  }, images: { uri: string; type: NadeImageType }[]) {
    const form = new FormData();
    form.append('group_id', String(dto.group_id));
    form.append('map_name', dto.map_name);
    form.append('side', dto.side);
    form.append('category', dto.category);
    form.append('nade_type', dto.nade_type);
    form.append('title', dto.title);
    if (dto.description) form.append('description', dto.description);
    if (dto.video_url) form.append('video_url', dto.video_url);
    if (dto.pos_x !== undefined) form.append('pos_x', String(dto.pos_x));
    if (dto.pos_y !== undefined) form.append('pos_y', String(dto.pos_y));
    form.append('image_types', JSON.stringify(images.map(i => i.type)));
    await appendImages(form, images.map(i => i.uri));

    const { data } = await apiClient.post('/nades', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000,
    });
    return data.data;
  },

  async updateNade(id: number, dto: {
    map_name?: string;
    side?: string;
    category?: string;
    nade_type?: string;
    title?: string;
    description?: string;
    video_url?: string | null;
    pos_x?: number | null;
    pos_y?: number | null;
  }) {
    const { data } = await apiClient.patch(`/nades/${id}`, dto);
    return data.data;
  },

  async addImages(id: number, images: { uri: string; type: NadeImageType }[]) {
    const form = new FormData();
    form.append('image_types', JSON.stringify(images.map(i => i.type)));
    await appendImages(form, images.map(i => i.uri));
    const { data } = await apiClient.post(`/nades/${id}/images`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000,
    });
    return data.data;
  },

  async deleteImage(imageId: number) {
    const { data } = await apiClient.delete(`/nades/images/${imageId}`);
    return data.data;
  },

  async deleteNade(id: number) {
    const { data } = await apiClient.delete(`/nades/${id}`);
    return data.data;
  },

  // --- Фон мини-карты ---
  async getBackground(groupId: number, mapName: string): Promise<MapBackground | null> {
    const { data } = await apiClient.get(`/nades/background?groupId=${groupId}&mapName=${encodeURIComponent(mapName)}`);
    return data.data;
  },

  async setBackground(groupId: number, mapName: string, imageUri: string): Promise<MapBackground> {
    const form = new FormData();
    form.append('group_id', String(groupId));
    form.append('map_name', mapName);
    await appendFile(form, 'image', imageUri, 0);
    const { data } = await apiClient.put('/nades/background', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000,
    });
    return data.data;
  },

  async deleteBackground(groupId: number, mapName: string) {
    const { data } = await apiClient.delete(`/nades/background?groupId=${groupId}&mapName=${encodeURIComponent(mapName)}`);
    return data.data;
  },
};
