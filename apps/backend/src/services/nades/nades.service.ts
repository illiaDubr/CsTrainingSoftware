import fs from 'fs';
import path from 'path';
import { db } from '../../config/database';
import { AppError } from '../../middlewares/errorHandler';
import { assertGroupMember, assertCoachAccess } from '../groups/groupAccess';

const UPLOADS_ROOT = path.join(process.cwd(), 'uploads');

const attachImages = async (nades: any[]) => {
  if (nades.length === 0) return nades;
  const images = await db('nade_images')
    .whereIn('nade_id', nades.map(n => n.id))
    .orderBy('sort_order', 'asc');
  return nades.map(n => ({ ...n, images: images.filter(i => i.nade_id === n.id) }));
};

type ImageInput = { path: string; image_type: string };

export const getNadeMaps = async (groupId: number, userId: number, role: string) => {
  await assertGroupMember(groupId, userId, role);
  const rows = await db('nades')
    .where({ group_id: groupId })
    .select('map_name').count('id as count').groupBy('map_name').orderBy('map_name');
  return rows.map(r => ({ map_name: r.map_name, count: Number(r.count) }));
};

export const getNadesByMap = async (groupId: number, userId: number, role: string, mapName: string) => {
  await assertGroupMember(groupId, userId, role);
  const nades = await db('nades').where({ group_id: groupId, map_name: mapName }).orderBy('created_at', 'asc');
  return attachImages(nades);
};

export const createNade = async (groupId: number, userId: number, role: string, dto: {
  map_name: string; side: string; category: string; nade_type: string; title: string; description?: string;
  video_url?: string; pos_x?: number; pos_y?: number;
}, images: ImageInput[]) => {
  await assertCoachAccess(groupId, userId, role);

  const [nade] = await db('nades').insert({
    group_id: groupId, coach_id: userId, map_name: dto.map_name.trim(), side: dto.side, category: dto.category,
    nade_type: dto.nade_type, title: dto.title, description: dto.description || null,
    video_url: dto.video_url || null,
    pos_x: dto.pos_x ?? null, pos_y: dto.pos_y ?? null,
  }).returning('*');

  if (images.length > 0) {
    await db('nade_images').insert(images.map((img, i) => (
      { nade_id: nade.id, image_url: img.path, image_type: img.image_type, sort_order: i }
    )));
  }
  const [withImages] = await attachImages([nade]);
  return withImages;
};

export const updateNade = async (id: number, userId: number, role: string, dto: {
  map_name?: string; side?: string; category?: string; nade_type?: string; title?: string; description?: string;
  video_url?: string | null; pos_x?: number | null; pos_y?: number | null;
}) => {
  const nade = await db('nades').where({ id }).first();
  if (!nade) throw new AppError('Nade not found', 404);
  await assertCoachAccess(nade.group_id, userId, role);

  const updates: Record<string, any> = {};
  for (const key of ['map_name', 'side', 'category', 'nade_type', 'title', 'description', 'video_url', 'pos_x', 'pos_y'] as const) {
    if (dto[key] !== undefined) updates[key] = dto[key];
  }
  const [updated] = await db('nades').where({ id }).update({ ...updates, updated_at: db.fn.now() }).returning('*');
  const [withImages] = await attachImages([updated]);
  return withImages;
};

const removeFile = (imageUrl: string) => {
  const rel = imageUrl.replace(/^\/uploads\//, '');
  const full = path.join(UPLOADS_ROOT, rel);
  if (full.startsWith(UPLOADS_ROOT)) {
    fs.promises.unlink(full).catch(() => { /* file may not exist — not critical */ });
  }
};

export const addNadeImages = async (id: number, userId: number, role: string, images: ImageInput[]) => {
  const nade = await db('nades').where({ id }).first();
  if (!nade) throw new AppError('Nade not found', 404);
  await assertCoachAccess(nade.group_id, userId, role);

  const maxRow = await db('nade_images').where({ nade_id: id }).max('sort_order as max').first();
  const start = (maxRow?.max ?? -1) + 1;
  if (images.length > 0) {
    await db('nade_images').insert(images.map((img, i) => (
      { nade_id: id, image_url: img.path, image_type: img.image_type, sort_order: start + i }
    )));
  }
  const [withImages] = await attachImages([nade]);
  return withImages;
};

export const deleteNadeImage = async (imageId: number, userId: number, role: string) => {
  const image = await db('nade_images')
    .join('nades', 'nade_images.nade_id', 'nades.id')
    .where('nade_images.id', imageId)
    .select('nade_images.*', 'nades.group_id').first();
  if (!image) throw new AppError('Image not found', 404);
  await assertCoachAccess(image.group_id, userId, role);

  await db('nade_images').where({ id: imageId }).delete();
  removeFile(image.image_url);
  return { message: 'Image deleted' };
};

export const deleteNade = async (id: number, userId: number, role: string) => {
  const nade = await db('nades').where({ id }).first();
  if (!nade) throw new AppError('Nade not found', 404);
  await assertCoachAccess(nade.group_id, userId, role);

  const images = await db('nade_images').where({ nade_id: id });
  await db('nades').where({ id }).delete();
  images.forEach(i => removeFile(i.image_url));
  return { message: 'Nade deleted' };
};

// Фон мини-карты (радар) — свой на группу+карту, тренер/помощник загружает сам
export const getMapBackground = async (groupId: number, userId: number, role: string, mapName: string) => {
  await assertGroupMember(groupId, userId, role);
  const bg = await db('map_backgrounds').where({ group_id: groupId, map_name: mapName }).first();
  return bg || null;
};

export const setMapBackground = async (groupId: number, userId: number, role: string, mapName: string, imagePath: string) => {
  await assertCoachAccess(groupId, userId, role);
  const existing = await db('map_backgrounds').where({ group_id: groupId, map_name: mapName }).first();
  if (existing) {
    removeFile(existing.image_url);
    const [updated] = await db('map_backgrounds').where({ id: existing.id })
      .update({ image_url: imagePath, coach_id: userId, updated_at: db.fn.now() }).returning('*');
    return updated;
  }
  const [created] = await db('map_backgrounds').insert({
    group_id: groupId, map_name: mapName, coach_id: userId, image_url: imagePath,
  }).returning('*');
  return created;
};

export const deleteMapBackground = async (groupId: number, userId: number, role: string, mapName: string) => {
  await assertCoachAccess(groupId, userId, role);
  const existing = await db('map_backgrounds').where({ group_id: groupId, map_name: mapName }).first();
  if (!existing) throw new AppError('Background not found', 404);
  await db('map_backgrounds').where({ id: existing.id }).delete();
  removeFile(existing.image_url);
  return { message: 'Background deleted' };
};
