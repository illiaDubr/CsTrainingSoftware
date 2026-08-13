import { db } from '../../config/database';
import { AppError } from '../../middlewares/errorHandler';
import { hasCoachAccess } from '../groups/groupAccess';

const assertMembership = async (groupId: number, userId: number, role: string) => {
  if (role === 'admin') return;

  const group = await db('groups').where({ id: groupId }).first();
  if (!group) throw new AppError('Group not found', 404);

  if (role === 'coach') {
    if (group.coach_id !== userId) throw new AppError('Access denied', 403);
    return;
  }

  const member = await db('group_members').where({ group_id: groupId, player_id: userId }).first();
  if (!member) throw new AppError('Access denied', 403);
};

export const getMatchesByGroup = async (groupId: number, userId: number, role: string) => {
  await assertMembership(groupId, userId, role);

  return db('matches')
    .join('users', 'matches.created_by', 'users.id')
    .where({ group_id: groupId })
    .select('matches.*', 'users.username as created_by_username')
    .orderBy('scheduled_at', 'asc');
};

export const getMatchById = async (id: number, userId: number, role: string) => {
  const match = await db('matches')
    .join('users', 'matches.created_by', 'users.id')
    .where('matches.id', id)
    .select('matches.*', 'users.username as created_by_username')
    .first();
  if (!match) throw new AppError('Match not found', 404);

  await assertMembership(match.group_id, userId, role);
  return match;
};

export const createMatch = async (userId: number, role: string, dto: {
  group_id: number;
  match_class: string;
  opponent: string;
  scheduled_at: string;
  note?: string;
}) => {
  await assertMembership(dto.group_id, userId, role);

  const [match] = await db('matches')
    .insert({
      group_id: dto.group_id,
      created_by: userId,
      match_class: dto.match_class,
      opponent: dto.opponent.trim(),
      scheduled_at: dto.scheduled_at,
      note: dto.note || null,
    })
    .returning('*');

  return { ...match, created_by_username: undefined };
};

const getMatchForModify = async (matchId: number, userId: number, role: string) => {
  const match = await db('matches').where({ id: matchId }).first();
  if (!match) throw new AppError('Match not found', 404);

  if (match.created_by === userId) return match;

  // Тренер (реальный или помощник) может редактировать/удалять любой матч своей группы
  if (await hasCoachAccess(match.group_id, userId, role)) return match;

  throw new AppError('Access denied', 403);
};

export const updateMatch = async (id: number, userId: number, role: string, dto: {
  match_class?: string;
  opponent?: string;
  scheduled_at?: string;
  note?: string;
}) => {
  await getMatchForModify(id, userId, role);

  const updates: Record<string, any> = {};
  for (const key of ['match_class', 'opponent', 'scheduled_at', 'note'] as const) {
    if (dto[key] !== undefined) updates[key] = dto[key];
  }
  if (updates.opponent) updates.opponent = String(updates.opponent).trim();

  const [updated] = await db('matches')
    .where({ id })
    .update({ ...updates, updated_at: db.fn.now() })
    .returning('*');
  return updated;
};

export const deleteMatch = async (id: number, userId: number, role: string) => {
  await getMatchForModify(id, userId, role);
  await db('matches').where({ id }).delete();
  return { message: 'Match deleted' };
};
