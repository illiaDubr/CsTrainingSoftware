import { Platform } from 'react-native';
import { apiClient } from './apiClient';
import { API_URL } from '../constants';

const FILES_BASE = API_URL.replace(/\/api$/, '');

/** Полный URL картинки раскидки */
export const nadeImageUrl = (path: string) =>
  path.startsWith('http') ? path : `${FILES_BASE}${path}`;

const appendImages = async (form: FormData, uris: string[]) => {
  for (let i = 0; i < uris.length; i++) {
    const uri = uris[i];
    if (Platform.OS === 'web') {
      const blob = await (await fetch(uri)).blob();
      form.append('images', blob, `image-${Date.now()}-${i}.jpg`);
    } else {
      const ext = uri.split('.').pop()?.toLowerCase() || 'jpg';
      form.append('images', {
        uri,
        name: `image-${Date.now()}-${i}.${ext}`,
        type: `image/${ext === 'png' ? 'png' : 'jpeg'}`,
      } as any);
    }
  }
};

export const nadesService = {
  async getMaps() {
    const { data } = await apiClient.get('/nades/maps');
    return data.data;
  },

  async getNadesByMap(mapName: string) {
    const { data } = await apiClient.get(`/nades?mapName=${encodeURIComponent(mapName)}`);
    return data.data;
  },

  async createNade(dto: {
    map_name: string;
    side: string;
    category: string;
    nade_type: string;
    title: string;
    description?: string;
  }, imageUris: string[]) {
    const form = new FormData();
    form.append('map_name', dto.map_name);
    form.append('side', dto.side);
    form.append('category', dto.category);
    form.append('nade_type', dto.nade_type);
    form.append('title', dto.title);
    if (dto.description) form.append('description', dto.description);
    await appendImages(form, imageUris);

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
  }) {
    const { data } = await apiClient.patch(`/nades/${id}`, dto);
    return data.data;
  },

  async addImages(id: number, imageUris: string[]) {
    const form = new FormData();
    await appendImages(form, imageUris);
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
};
