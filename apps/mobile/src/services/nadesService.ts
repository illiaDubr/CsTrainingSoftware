import { Platform } from 'react-native';
import { apiClient } from './apiClient';
import { API_URL } from '../constants';
import { MapBackground, NadeImageType } from '../types';

const FILES_BASE = API_URL.replace(/\/api$/, '');

/** Полный URL картинки раскидки / фона карты */
export const nadeImageUrl = (path: string) =>
  path.startsWith('http') ? path : `${FILES_BASE}${path}`;

const appendFile = async (form: FormData, field: string, uri: string, i: number, kind: 'image' | 'video' = 'image') => {
  const defaultExt = kind === 'video' ? 'mp4' : 'jpg';
  if (Platform.OS === 'web') {
    const blob = await (await fetch(uri)).blob();
    form.append(field, blob, `${field}-${Date.now()}-${i}.${defaultExt}`);
  } else {
    const ext = uri.split('.').pop()?.toLowerCase() || defaultExt;
    const mime = kind === 'video'
      ? `video/${ext === 'mov' ? 'quicktime' : ext === 'mkv' ? 'x-matroska' : ext === 'webm' ? 'webm' : 'mp4'}`
      : `image/${ext === 'png' ? 'png' : 'jpeg'}`;
    form.append(field, {
      uri,
      name: `${field}-${Date.now()}-${i}.${ext}`,
      type: mime,
    } as any);
  }
};

const appendImages = async (form: FormData, uris: string[]) => {
  for (let i = 0; i < uris.length; i++) {
    await appendFile(form, 'images', uris[i], i, 'image');
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
    videoUri?: string;
    throw_x?: number;
    throw_y?: number;
    land_x?: number;
    land_y?: number;
  }, images: { uri: string; type: NadeImageType }[]) {
    const form = new FormData();
    form.append('group_id', String(dto.group_id));
    form.append('map_name', dto.map_name);
    form.append('side', dto.side);
    form.append('category', dto.category);
    form.append('nade_type', dto.nade_type);
    form.append('title', dto.title);
    if (dto.description) form.append('description', dto.description);
    if (dto.videoUri) {
      await appendFile(form, 'video', dto.videoUri, 0, 'video');
    } else if (dto.video_url) {
      form.append('video_url', dto.video_url);
    }
    if (dto.throw_x !== undefined) form.append('throw_x', String(dto.throw_x));
    if (dto.throw_y !== undefined) form.append('throw_y', String(dto.throw_y));
    if (dto.land_x !== undefined) form.append('land_x', String(dto.land_x));
    if (dto.land_y !== undefined) form.append('land_y', String(dto.land_y));
    form.append('image_types', JSON.stringify(images.map(i => i.type)));
    await appendImages(form, images.map(i => i.uri));

    const { data } = await apiClient.post('/nades', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120000,
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
    throw_x?: number | null;
    throw_y?: number | null;
    land_x?: number | null;
    land_y?: number | null;
  }) {
    const { data } = await apiClient.patch(`/nades/${id}`, dto);
    return data.data;
  },

  async setVideo(id: number, videoUri: string) {
    const form = new FormData();
    await appendFile(form, 'video', videoUri, 0, 'video');
    const { data } = await apiClient.post(`/nades/${id}/video`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120000,
    });
    return data.data;
  },

  async deleteVideo(id: number) {
    const { data } = await apiClient.delete(`/nades/${id}/video`);
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
