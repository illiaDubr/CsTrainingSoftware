import { db } from '../../config/database';
import { AppError } from '../../middlewares/errorHandler';

export const getMaterials = async (groupId: number) => {
  return db('materials')
    .where({ group_id: groupId })
    .select('*')
    .orderBy('created_at', 'desc');
};

export const createMaterial = async (coachId: number, dto: {
  group_id: number;
  title: string;
  description?: string;
  external_url?: string;
  type: string;
}) => {
  const group = await db('groups').where({ id: dto.group_id, coach_id: coachId }).first();
  if (!group) throw new AppError('Group not found or access denied', 404);

  const [material] = await db('materials')
    .insert({ ...dto, coach_id: coachId })
    .returning('*');
  return material;
};

export const updateMaterial = async (id: number, coachId: number, dto: {
  title?: string;
  description?: string;
  external_url?: string;
  type?: string;
}) => {
  const material = await db('materials').where({ id, coach_id: coachId }).first();
  if (!material) throw new AppError('Material not found or access denied', 404);

  const [updated] = await db('materials')
    .where({ id })
    .update({ ...dto, updated_at: db.fn.now() })
    .returning('*');
  return updated;
};

export const deleteMaterial = async (id: number, coachId: number) => {
  const material = await db('materials').where({ id, coach_id: coachId }).first();
  if (!material) throw new AppError('Material not found or access denied', 404);

  await db('materials').where({ id }).delete();
  return { message: 'Material deleted' };
};