import { db } from '../../config/database';
import { AppError } from '../../middlewares/errorHandler';

export const getMyGroups = async (userId: number, role: string) => {
  if (role === 'coach') {
    return db('groups')
      .where({ coach_id: userId })
      .select('id', 'name', 'description', 'coach_id', 'created_at')
      .orderBy('created_at', 'desc');
  }

  if (role === 'player') {
    return db('groups')
      .join('group_members', 'groups.id', 'group_members.group_id')
      .where({ 'group_members.player_id': userId })
      .select('groups.id', 'groups.name', 'groups.description', 'groups.coach_id', 'groups.created_at')
      .orderBy('groups.created_at', 'desc');
  }

  // admin видит все группы
  return db('groups')
    .select('id', 'name', 'description', 'coach_id', 'created_at')
    .orderBy('created_at', 'desc');
};

export const getGroupById = async (id: number) => {
  const group = await db('groups').where({ id }).first();
  if (!group) throw new AppError('Group not found', 404);

  const members = await db('users')
    .join('group_members', 'users.id', 'group_members.player_id')
    .where({ 'group_members.group_id': id })
    .select('users.id', 'users.username', 'users.email', 'users.avatar_url');

  return { ...group, members };
};

export const createGroup = async (coachId: number, dto: { name: string; description?: string }) => {
  const [group] = await db('groups')
    .insert({ name: dto.name, description: dto.description, coach_id: coachId })
    .returning('*');
  return group;
};

export const updateGroup = async (id: number, coachId: number, dto: { name?: string; description?: string }) => {
  const group = await db('groups').where({ id, coach_id: coachId }).first();
  if (!group) throw new AppError('Group not found or access denied', 404);

  const [updated] = await db('groups')
    .where({ id })
    .update({ ...dto, updated_at: db.fn.now() })
    .returning('*');
  return updated;
};

export const addMember = async (groupId: number, coachId: number, playerId: number) => {
  const group = await db('groups').where({ id: groupId, coach_id: coachId }).first();
  if (!group) throw new AppError('Group not found or access denied', 404);

  const player = await db('users').where({ id: playerId, role: 'player' }).first();
  if (!player) throw new AppError('Player not found', 404);

  const existing = await db('group_members').where({ group_id: groupId, player_id: playerId }).first();
  if (existing) throw new AppError('Player already in group', 409);

  await db('group_members').insert({ group_id: groupId, player_id: playerId });
  return { message: 'Player added successfully' };
};

export const removeMember = async (groupId: number, coachId: number, playerId: number) => {
  const group = await db('groups').where({ id: groupId, coach_id: coachId }).first();
  if (!group) throw new AppError('Group not found or access denied', 404);

  await db('group_members').where({ group_id: groupId, player_id: playerId }).delete();
  return { message: 'Player removed successfully' };
};