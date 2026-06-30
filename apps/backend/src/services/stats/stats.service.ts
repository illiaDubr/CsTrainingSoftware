import { db } from '../../config/database';
import { AppError } from '../../middlewares/errorHandler';

export const getPlayerActivity = async (playerId: number, requesterId: number, requesterRole: string) => {
  if (requesterRole === 'player' && requesterId !== playerId) {
    throw new AppError('Access denied', 403);
  }

  if (requesterRole === 'coach') {
    const inGroup = await db('group_members')
      .join('groups', 'group_members.group_id', 'groups.id')
      .where({ 'group_members.player_id': playerId, 'groups.coach_id': requesterId })
      .first();
    if (!inGroup) throw new AppError('Access denied', 403);
  }

  // Дата на год назад
  const yearAgo = new Date();
  yearAgo.setFullYear(yearAgo.getFullYear() - 1);

  const taskCompletions = await db('task_progress')
    .where({ player_id: playerId, status: 'completed' })
    .andWhere('completed_at', '>=', yearAgo)
    .select(db.raw("DATE(completed_at) as date"))
    .count('* as count')
    .groupByRaw('DATE(completed_at)');

  const routineCompletions = await db('routine_progress')
    .where({ player_id: playerId, status: 'completed' })
    .andWhere('completed_at', '>=', yearAgo)
    .select(db.raw("DATE(completed_at) as date"))
    .count('* as count')
    .groupByRaw('DATE(completed_at)');

  
 const normalizeDate = (raw: any): string => {
    const d = raw instanceof Date ? raw : new Date(raw);
    return d.toISOString().split('T')[0];
  };

  const map = new Map<string, number>();

  for (const row of taskCompletions) {
    const date = normalizeDate(row.date);
    map.set(date, (map.get(date) || 0) + Number(row.count));
  }
  for (const row of routineCompletions) {
    const date = normalizeDate(row.date);
    map.set(date, (map.get(date) || 0) + Number(row.count));
  }

  const activity = Array.from(map.entries()).map(([date, count]) => ({ date, count }));
  const total = activity.reduce((sum, a) => sum + a.count, 0);

  return { total, activity };
};