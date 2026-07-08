import { db } from '../../config/database';
import { AppError } from '../../middlewares/errorHandler';

const todayDate = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const currentMonthRange = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const firstDay = `${year}-${month}-01`;
  const lastDay = `${year}-${month}-${String(new Date(year, now.getMonth() + 1, 0).getDate()).padStart(2, '0')}`;
  return { firstDay, lastDay };
};

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

const ensureTodayProgressPersonal = async (playerId: number) => {
  const routines = await db('routines').where({ player_id: playerId, is_active: true });
  if (routines.length === 0) return;

  const today = todayDate();

  for (const routine of routines) {
    const existing = await db('routine_progress')
      .where({ routine_id: routine.id, player_id: playerId, date: today })
      .first();
    if (!existing) {
      await db('routine_progress').insert({
        routine_id: routine.id, player_id: playerId, date: today, status: 'pending',
      });
    }
  }
};

const toDateStr = (date: any) => {
  const d = date instanceof Date ? date : new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const shapeMonthProgress = (progress: any[]) =>
  progress.map(p => ({
    date: toDateStr(p.date),
    status: p.status,
    note: p.note || '',
    time_spent_minutes: p.time_spent_minutes ?? null,
  }));

const shapePlayerRoutines = (routines: any[], progress: any[], today: string) => {
  return routines.map(r => {
    const routineProgress = progress.filter(p => p.routine_id === r.id);
    const todayProgress = routineProgress.find(p => toDateStr(p.date) === today);
    const completed = routineProgress.filter(p => p.status === 'completed').length;
    const total = routineProgress.length;

    return {
      ...r,
      todayStatus: todayProgress?.status || 'pending',
      todayNote: todayProgress?.note || '',
      todayTimeSpent: todayProgress?.time_spent_minutes ?? null,
      monthProgress: shapeMonthProgress(routineProgress),
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  });
};

export const getPersonalRoutines = async (playerId: number) => {
  await ensureTodayProgressPersonal(playerId);

  const routines = await db('routines').where({ player_id: playerId, is_active: true });
  const { firstDay, lastDay } = currentMonthRange();
  const today = todayDate();

  const progress = await db('routine_progress')
    .where({ player_id: playerId })
    .whereBetween('date', [firstDay, lastDay])
    .whereIn('routine_id', routines.map(r => r.id))
    .select('*');

  return shapePlayerRoutines(routines, progress, today);
};

export const getPersonalRoutinesForCoach = async (coachId: number, playerId: number) => {
  // Тренер может смотреть только рутину игроков из своих групп
  const shared = await db('group_members')
    .join('groups', 'group_members.group_id', 'groups.id')
    .where('groups.coach_id', coachId)
    .andWhere('group_members.player_id', playerId)
    .first();

  if (!shared) throw new AppError('Player is not in your groups', 403);

  return getPersonalRoutines(playerId);
};

export const createPersonalRoutine = async (playerId: number, dto: {
  title: string;
  description?: string;
  priority?: string;
}) => {
  const [routine] = await db('routines')
    .insert({
      player_id: playerId,
      title: dto.title,
      description: dto.description,
      priority: dto.priority || 'medium',
    })
    .returning('*');

  return routine;
};

export const getRoutinesByGroup = async (groupId: number, userId: number, role: string) => {
  await ensureTodayProgress(groupId);

  const routines = await db('routines').where({ group_id: groupId, is_active: true });
  const { firstDay, lastDay } = currentMonthRange();
  const today = todayDate();

  if (role === 'player') {
    const progress = await db('routine_progress')
      .where({ player_id: userId })
      .whereBetween('date', [firstDay, lastDay])
      .whereIn('routine_id', routines.map(r => r.id))
      .select('*');

    return shapePlayerRoutines(routines, progress, today);
  }

  if (role === 'coach') {
    const members = await db('group_members')
      .join('users', 'group_members.player_id', 'users.id')
      .where({ group_id: groupId })
      .select('users.id', 'users.username');

    const progress = await db('routine_progress')
      .whereBetween('date', [firstDay, lastDay])
      .whereIn('routine_id', routines.map(r => r.id))
      .join('users', 'routine_progress.player_id', 'users.id')
      .select('routine_progress.*', 'users.username');

    return routines.map(r => {
      const routineProgress = progress.filter(p => p.routine_id === r.id);

      const playerStats = members.map(m => {
        const playerProgress = routineProgress.filter(p => p.player_id === m.id);
        const completed = playerProgress.filter(p => p.status === 'completed').length;
        const total = playerProgress.length;
        const todayP = playerProgress.find(p => toDateStr(p.date) === today);

        return {
          playerId: m.id,
          username: m.username,
          todayStatus: todayP?.status || 'pending',
          todayNote: todayP?.note || '',
          todayTimeSpent: todayP?.time_spent_minutes ?? null,
          completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
          monthProgress: shapeMonthProgress(playerProgress),
        };
      });

      return { ...r, playerStats };
    });
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

export const updateRoutine = async (id: number, userId: number, dto: {
  title?: string;
  description?: string;
  priority?: string;
}) => {
  // Владелец — тренер (групповая рутина) или игрок (индивидуальная)
  const routine = await db('routines')
    .where({ id })
    .andWhere((qb) => {
      qb.where({ coach_id: userId }).orWhere({ player_id: userId });
    })
    .first();
  if (!routine) throw new AppError('Routine not found or access denied', 404);

  const updates: Record<string, any> = {};
  if (dto.title !== undefined) updates.title = dto.title;
  if (dto.description !== undefined) updates.description = dto.description;
  if (dto.priority !== undefined) updates.priority = dto.priority;

  const [updated] = await db('routines')
    .where({ id })
    .update({ ...updates, updated_at: db.fn.now() })
    .returning('*');

  return updated;
};

export const deactivateRoutine = async (id: number, userId: number) => {
  // Владелец — тренер (групповая рутина) или игрок (индивидуальная)
  const routine = await db('routines')
    .where({ id })
    .andWhere((qb) => {
      qb.where({ coach_id: userId }).orWhere({ player_id: userId });
    })
    .first();
  if (!routine) throw new AppError('Routine not found or access denied', 404);

  await db('routines').where({ id }).update({ is_active: false, updated_at: db.fn.now() });
  return { message: 'Routine deactivated' };
};

export const updateRoutineProgress = async (routineId: number, playerId: number, dto: {
  status: string;
  note?: string;
  time_spent_minutes?: number | null;
}) => {
  const today = todayDate();

  const existing = await db('routine_progress')
    .where({ routine_id: routineId, player_id: playerId, date: today })
    .first();
  if (!existing) throw new AppError('Routine not assigned to you today', 404);

  const completed_at = dto.status === 'completed' ? db.fn.now() : null;

  const [updated] = await db('routine_progress')
    .where({ routine_id: routineId, player_id: playerId, date: today })
    .update({
      status: dto.status,
      note: dto.note,
      time_spent_minutes: dto.time_spent_minutes ?? null,
      completed_at,
      updated_at: db.fn.now(),
    })
    .returning('*');

  return updated;
};