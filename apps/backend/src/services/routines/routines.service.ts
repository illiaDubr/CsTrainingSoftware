import { db } from '../../config/database';
import { AppError } from '../../middlewares/errorHandler';

const todayDate = () => new Date().toISOString().split('T')[0];

// Гарантирует что для всех активных routine группы есть запись на сегодня для каждого игрока
const ensureTodayProgress = async (groupId: number) => {
  const routines = await db('routines').where({ group_id: groupId, is_active: true });
  if (routines.length === 0) return;

  const members = await db('group_members').where({ group_id: groupId });
  if (members.length === 0) return;

  const today = todayDate();

  for (const routine of routines) {
    const existing = await db('routine_progress')
      .where({ routine_id: routine.id, date: today })
      .select('player_id');
    const existingPlayerIds = new Set(existing.map(e => e.player_id));

    const toInsert = members
      .filter(m => !existingPlayerIds.has(m.player_id))
      .map(m => ({ routine_id: routine.id, player_id: m.player_id, date: today, status: 'pending' }));

    if (toInsert.length > 0) {
      await db('routine_progress').insert(toInsert);
    }
  }
};

export const getRoutinesByGroup = async (groupId: number, userId: number, role: string) => {
  await ensureTodayProgress(groupId);

  const routines = await db('routines').where({ group_id: groupId, is_active: true });
  const today = todayDate();

  if (role === 'player') {
    const progress = await db('routine_progress').where({ player_id: userId, date: today });
    return routines.map(r => ({
      ...r,
      progress: progress.find(p => p.routine_id === r.id) || { status: 'pending' },
    }));
  }

  if (role === 'coach') {
    const progress = await db('routine_progress')
      .join('users', 'routine_progress.player_id', 'users.id')
      .where({ date: today })
      .whereIn('routine_id', routines.map(r => r.id))
      .select('routine_progress.*', 'users.username');

    return routines.map(r => ({
      ...r,
      progress: progress.filter(p => p.routine_id === r.id),
    }));
  }

  return routines;
};

export const createRoutine = async (coachId: number, dto: {
  group_id: number;
  title: string;
  description?: string;
  priority?: string;
}) => {
  const group = await db('groups').where({ id: dto.group_id, coach_id: coachId }).first();
  if (!group) throw new AppError('Group not found or access denied', 404);

  const [routine] = await db('routines')
    .insert({
      group_id: dto.group_id,
      coach_id: coachId,
      title: dto.title,
      description: dto.description,
      priority: dto.priority || 'medium',
    })
    .returning('*');

  return routine;
};

export const deactivateRoutine = async (id: number, coachId: number) => {
  const routine = await db('routines').where({ id, coach_id: coachId }).first();
  if (!routine) throw new AppError('Routine not found or access denied', 404);

  await db('routines').where({ id }).update({ is_active: false, updated_at: db.fn.now() });
  return { message: 'Routine deactivated' };
};

export const updateRoutineProgress = async (routineId: number, playerId: number, dto: {
  status: string;
  note?: string;
}) => {
  const today = todayDate();

  const existing = await db('routine_progress').where({ routine_id: routineId, player_id: playerId, date: today }).first();
  if (!existing) throw new AppError('Routine not assigned to you today', 404);

  const completed_at = dto.status === 'completed' ? db.fn.now() : null;

  const [updated] = await db('routine_progress')
    .where({ routine_id: routineId, player_id: playerId, date: today })
    .update({ status: dto.status, note: dto.note, completed_at, updated_at: db.fn.now() })
    .returning('*');

  return updated;
};