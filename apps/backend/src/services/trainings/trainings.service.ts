import { db } from '../../config/database';
import { AppError } from '../../middlewares/errorHandler';
import { assertCoachAccess } from '../groups/groupAccess';

export const getTrainings = async (groupId: number) => {
  return db('trainings')
    .where({ group_id: groupId })
    .select('*')
    .orderBy('scheduled_at', 'asc');
};

export const createTraining = async (userId: number, role: string, dto: {
  group_id: number;
  title: string;
  description?: string;
  scheduled_at: string;
  duration_minutes?: number;
}) => {
  await assertCoachAccess(dto.group_id, userId, role);
  const group = await db('groups').where({ id: dto.group_id }).first();
  if (!group) throw new AppError('Group not found', 404);

  const [training] = await db('trainings')
    .insert({ ...dto, coach_id: group.coach_id })
    .returning('*');
  return training;
};

export const updateTraining = async (id: number, userId: number, role: string, dto: {
  title?: string;
  description?: string;
  scheduled_at?: string;
  duration_minutes?: number;
}) => {
  const training = await db('trainings').where({ id }).first();
  if (!training) throw new AppError('Training not found', 404);
  await assertCoachAccess(training.group_id, userId, role);

  const [updated] = await db('trainings')
    .where({ id })
    .update({ ...dto, updated_at: db.fn.now() })
    .returning('*');
  return updated;
};

export const deleteTraining = async (id: number, userId: number, role: string) => {
  const training = await db('trainings').where({ id }).first();
  if (!training) throw new AppError('Training not found', 404);
  await assertCoachAccess(training.group_id, userId, role);

  await db('trainings').where({ id }).delete();
  return { message: 'Training deleted' };
};
