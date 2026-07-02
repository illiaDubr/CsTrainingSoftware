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

    return routines.map(r => {
      const routineProgress = progress.filter(p => p.routine_id === r.id);
      const todayProgress = routineProgress.find(p => {
        const d = p.date instanceof Date ? p.date : new Date(p.date);
        const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        return dateStr === today;
      });
      const completed = routineProgress.filter(p => p.status === 'completed').length;
      const total = routineProgress.length;

      return {
        ...r,
        todayStatus: todayProgress?.status || 'pending',
        todayNote: todayProgress?.note || '',
        monthProgress: routineProgress.map(p => {
          const d = p.date instanceof Date ? p.date : new Date(p.date);
          return {
            date: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
            status: p.status,
          };
        }),
        completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      };
    });
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
        const todayP = playerProgress.find(p => {
          const d = p.date instanceof Date ? p.date : new Date(p.date);
          const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          return dateStr === today;
        });

        return {
          playerId: m.id,
          username: m.username,
          todayStatus: todayP?.status || 'pending',
          completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
          monthProgress: playerProgress.map(p => {
            const d = p.date instanceof Date ? p.date : new Date(p.date);
            return {
              date: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
              status: p.status,
            };
          }),
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

  const existing = await db('routine_progress')
    .where({ routine_id: routineId, player_id: playerId, date: today })
    .first();
  if (!existing) throw new AppError('Routine not assigned to you today', 404);

  const completed_at = dto.status === 'completed' ? db.fn.now() : null;

  const [updated] = await db('routine_progress')
    .where({ routine_id: routineId, player_id: playerId, date: today })
    .update({ status: dto.status, note: dto.note, completed_at, updated_at: db.fn.now() })
    .returning('*');

  return updated;
};