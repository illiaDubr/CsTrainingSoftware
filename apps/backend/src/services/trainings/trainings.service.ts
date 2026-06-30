import { db } from '../../config/database';
import { AppError } from '../../middlewares/errorHandler';

export const getTrainings = async (groupId: number) => {
  return db('trainings')
    .where({ group_id: groupId })
    .select('*')
    .orderBy('scheduled_at', 'asc');
};

export const createTraining = async (coachId: number, dto: {
  group_id: number;
  title: string;
  description?: string;
  scheduled_at: string;
  duration_minutes?: number;
}) => {
  const group = await db('groups').where({ id: dto.group_id, coach_id: coachId }).first();
  if (!group) throw new AppError('Group not found or access denied', 404);

  const [training] = await db('trainings')
    .insert({ ...dto, coach_id: coachId })
    .returning('*');
  return training;
};

export const updateTraining = async (id: number, coachId: number, dto: {
  title?: string;
  description?: string;
  scheduled_at?: string;
  duration_minutes?: number;
}) => {
  const training = await db('trainings').where({ id, coach_id: coachId }).first();
  if (!training) throw new AppError('Training not found or access denied', 404);

  const [updated] = await db('trainings')
    .where({ id })
    .update({ ...dto, updated_at: db.fn.now() })
    .returning('*');
  return updated;
};

export const deleteTraining = async (id: number, coachId: number) => {
  const training = await db('trainings').where({ id, coach_id: coachId }).first();
  if (!training) throw new AppError('Training not found or access denied', 404);

  await db('trainings').where({ id }).delete();
  return { message: 'Training deleted' };
};