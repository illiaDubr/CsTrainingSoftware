import fs from 'fs';
import path from 'path';
import { db } from '../../config/database';
import { AppError } from '../../middlewares/errorHandler';

const UPLOADS_ROOT = path.join(process.cwd(), 'uploads');

/** id тренеров, чьи раскидки видит игрок (тренеры его групп) */
const coachIdsForPlayer = async (playerId: number): Promise<number[]> => {
  const rows = await db('group_members')
    .join('groups', 'group_members.group_id', 'groups.id')
    .where('group_members.player_id', playerId)
    .distinct('groups.coach_id');
  return rows.map(r => r.coach_id).filter(Boolean);
};

const resolveCoachIds = async (userId: number, role: string): Promise<number[]> => {
  if (role === 'coach') return [userId];
  const ids = await coachIdsForPlayer(userId);
  if (ids.length === 0) throw new AppError('You are not in any group', 403);
  return ids;
};

const attachImages = async (nades: any[]) => {
  if (nades.length === 0) return nades;
  const images = await db('nade_images')
    .whereIn('nade_id', nades.map(n => n.id))
    .orderBy('sort_order', 'asc');
  return nades.map(n => ({
    ...n,
    images: images.filter(i => i.nade_id === n.id),
  }));
};

/** Список карт с количеством раскидок */
export const getNadeMaps = async (userId: number, role: string) => {
  const coachIds = await resolveCoachIds(userId, role);
  const rows = await db('nades')
    .whereIn('coach_id', coachIds)
    .select('map_name')
    .count('id as count')
    .groupBy('map_name')
    .orderBy('map_name');
  return rows.map(r => ({ map_name: r.map_name, count: Number(r.count) }));
};

export const getNadesByMap = async (userId: number, role: string, mapName: string) => {
  const coachIds = await resolveCoachIds(userId, role);
  const nades = await db('nades')
    .whereIn('coach_id', coachIds)
    .andWhere({ map_name: mapName })
    .orderBy('created_at', 'asc');
  return attachImages(nades);
};

export const createNade = async (coachId: number, dto: {
  map_name: string;
  side: string;
  category: string;
  nade_type: string;
  title: string;
  description?: string;
}, imagePaths: string[]) => {
  const [nade] = await db('nades')
    .insert({
      coach_id: coachId,
      map_name: dto.map_name.trim(),
      side: dto.side,
      category: dto.category,
      nade_type: dto.nade_type,
      title: dto.title,
      description: dto.description || null,
    })
    .returning('*');

  if (imagePaths.length > 0) {
    await db('nade_images').insert(
      imagePaths.map((p, i) => ({ nade_id: nade.id, image_url: p, sort_order: i }))
    );
  }

  const [withImages] = await attachImages([nade]);
  return withImages;
};

export const updateNade = async (id: number, coachId: number, dto: {
  map_name?: string;
  side?: string;
  category?: string;
  nade_type?: string;
  title?: string;
  description?: string;
}) => {
  const nade = await db('nades').where({ id, coach_id: coachId }).first();
  if (!nade) throw new AppError('Nade not found or access denied', 404);

  const updates: Record<string, any> = {};
  for (const key of ['map_name', 'side', 'category', 'nade_type', 'title', 'description'] as const) {
    if (dto[key] !== undefined) updates[key] = dto[key];
  }

  const [updated] = await db('nades')
    .where({ id })
    .update({ ...updates, updated_at: db.fn.now() })
    .returning('*');

  const [withImages] = await attachImages([updated]);
  return withImages;
};

const removeFile = (imageUrl: string) => {
  // image_url хранится как '/uploads/nades/xxx.jpg'
  const rel = imageUrl.replace(/^\/uploads\//, '');
  const full = path.join(UPLOADS_ROOT, rel);
  if (full.startsWith(UPLOADS_ROOT)) {
    fs.promises.unlink(full).catch(() => { /* файла может не быть — не критично */ });
  }
};

export const addNadeImages = async (id: number, coachId: number, imagePaths: string[]) => {
  const nade = await db('nades').where({ id, coach_id: coachId }).first();
  if (!nade) throw new AppError('Nade not found or access denied', 404);

  const maxRow = await db('nade_images').where({ nade_id: id }).max('sort_order as max').first();
  const start = (maxRow?.max ?? -1) + 1;

  if (imagePaths.length > 0) {
    await db('nade_images').insert(
      imagePaths.map((p, i) => ({ nade_id: id, image_url: p, sort_order: start + i }))
    );
  }

  const [withImages] = await attachImages([nade]);
  return withImages;
};

export const deleteNadeImage = async (imageId: number, coachId: number) => {
  const image = await db('nade_images')
    .join('nades', 'nade_images.nade_id', 'nades.id')
    .where('nade_images.id', imageId)
    .andWhere('nades.coach_id', coachId)
    .select('nade_images.*')
    .first();
  if (!image) throw new AppError('Image not found or access denied', 404);

  await db('nade_images').where({ id: imageId }).delete();
  removeFile(image.image_url);
  return { message: 'Image deleted' };
};

export const deleteNade = async (id: number, coachId: number) => {
  const nade = await db('nades').where({ id, coach_id: coachId }).first();
  if (!nade) throw new AppError('Nade not found or access denied', 404);

  const images = await db('nade_images').where({ nade_id: id });
  await db('nades').where({ id }).delete();
  images.forEach(i => removeFile(i.image_url));
  return { message: 'Nade deleted' };
};
