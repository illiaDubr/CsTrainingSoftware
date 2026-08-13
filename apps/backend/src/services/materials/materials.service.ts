import { db } from '../../config/database';
import { AppError } from '../../middlewares/errorHandler';
import { assertCoachAccess } from '../groups/groupAccess';

export const getMaterials = async (groupId: number) => {
  return db('materials')
    .where({ group_id: groupId })
    .select('*')
    .orderBy('created_at', 'desc');
};

export const createMaterial = async (userId: number, role: string, dto: {
  group_id: number;
  title: string;
  description?: string;
  external_url?: string;
  type: string;
}) => {
  await assertCoachAccess(dto.group_id, userId, role);
  const group = await db('groups').where({ id: dto.group_id }).first();
  if (!group) throw new AppError('Group not found', 404);

  const [material] = await db('materials')
    .insert({ ...dto, coach_id: group.coach_id })
    .returning('*');
  return material;
};

export const updateMaterial = async (id: number, userId: number, role: string, dto: {
  title?: string;
  description?: string;
  external_url?: string;
  type?: string;
}) => {
  const material = await db('materials').where({ id }).first();
  if (!material) throw new AppError('Material not found', 404);
  await assertCoachAccess(material.group_id, userId, role);

  const [updated] = await db('materials')
    .where({ id })
    .update({ ...dto, updated_at: db.fn.now() })
    .returning('*');
  return updated;
};

export const deleteMaterial = async (id: number, userId: number, role: string) => {
  const material = await db('materials').where({ id }).first();
  if (!material) throw new AppError('Material not found', 404);
  await assertCoachAccess(material.group_id, userId, role);

  await db('materials').where({ id }).delete();
  return { message: 'Material deleted' };
};
