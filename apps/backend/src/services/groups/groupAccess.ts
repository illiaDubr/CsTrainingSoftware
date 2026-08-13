import { db } from '../../config/database';
import { AppError } from '../../middlewares/errorHandler';

/**
 * ID групп, где пользователь имеет права тренера: свои группы (реальный тренер)
 * плюс группы, где он назначен помощником тренера. 'all' — для админа.
 */
export const getCoachAccessGroupIds = async (userId: number, role: string): Promise<number[] | 'all'> => {
  if (role === 'admin') return 'all';

  const owned = await db('groups').where({ coach_id: userId }).select('id');
  const assisted = await db('group_members').where({ player_id: userId, is_assistant_coach: true }).select('group_id');

  const ids = new Set<number>();
  owned.forEach((g) => ids.add(g.id));
  assisted.forEach((m) => ids.add(m.group_id));
  return Array.from(ids);
};

/** Бросает 403/404, если у пользователя нет тренерского доступа (реального или помощника) к группе */
export const assertCoachAccess = async (groupId: number, userId: number, role: string): Promise<void> => {
  const ids = await getCoachAccessGroupIds(userId, role);
  if (ids === 'all') return;
  if (ids.includes(groupId)) return;

  const group = await db('groups').where({ id: groupId }).first();
  if (!group) throw new AppError('Group not found', 404);
  throw new AppError('Access denied', 403);
};

/** true/false-версия без исключений (удобно для необязательных проверок) */
export const hasCoachAccess = async (groupId: number, userId: number, role: string): Promise<boolean> => {
  try {
    await assertCoachAccess(groupId, userId, role);
    return true;
  } catch {
    return false;
  }
};

/** Бросает 403/404, если пользователь не состоит в группе (ни как тренер/помощник, ни как игрок) */
export const assertGroupMember = async (groupId: number, userId: number, role: string): Promise<void> => {
  if (role === 'admin') return;

  const group = await db('groups').where({ id: groupId }).first();
  if (!group) throw new AppError('Group not found', 404);

  if (role === 'coach' && group.coach_id === userId) return;

  const member = await db('group_members').where({ group_id: groupId, player_id: userId }).first();
  if (member) return;

  throw new AppError('Access denied', 403);
};

/** Проверяет, что userId имеет тренерский доступ хотя бы к одной группе, в которой состоит playerId */
export const assertSharesGroupWithPlayer = async (userId: number, role: string, playerId: number): Promise<void> => {
  const ids = await getCoachAccessGroupIds(userId, role);
  if (ids === 'all') return;
  if (ids.length === 0) throw new AppError('Player is not in your groups', 403);

  const shared = await db('group_members').where({ player_id: playerId }).whereIn('group_id', ids).first();
  if (!shared) throw new AppError('Player is not in your groups', 403);
};
