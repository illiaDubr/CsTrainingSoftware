import { db } from '../../config/database';
import { AppError } from '../../middlewares/errorHandler';
import { assertCoachAccess } from './groupAccess';

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
      .select(
        'groups.id', 'groups.name', 'groups.description', 'groups.coach_id', 'groups.created_at',
        'group_members.is_assistant_coach'
      )
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
    .select('users.id', 'users.username', 'users.email', 'users.avatar_url', 'group_members.is_assistant_coach');

  return { ...group, members };
};

export const createGroup = async (coachId: number, dto: { name: string; description?: string }) => {
  const [group] = await db('groups')
    .insert({ name: dto.name, description: dto.description, coach_id: coachId })
    .returning('*');
  return group;
};

export const updateGroup = async (id: number, userId: number, role: string, dto: { name?: string; description?: string }) => {
  await assertCoachAccess(id, userId, role);

  const [updated] = await db('groups')
    .where({ id })
    .update({ ...dto, updated_at: db.fn.now() })
    .returning('*');
  return updated;
};

export const addMember = async (groupId: number, userId: number, role: string, playerId: number) => {
  await assertCoachAccess(groupId, userId, role);

  const player = await db('users').where({ id: playerId, role: 'player' }).first();
  if (!player) throw new AppError('Player not found', 404);

  const existing = await db('group_members').where({ group_id: groupId, player_id: playerId }).first();
  if (existing) throw new AppError('Player already in group', 409);

  await db('group_members').insert({ group_id: groupId, player_id: playerId });
  return { message: 'Player added successfully' };
};

export const removeMember = async (groupId: number, userId: number, role: string, playerId: number) => {
  await assertCoachAccess(groupId, userId, role);

  await db('group_members').where({ group_id: groupId, player_id: playerId }).delete();
  return { message: 'Player removed successfully' };
};

/** Назначить/снять помощника тренера — доступно только реальному тренеру группы (не другим помощникам) */
export const setAssistantCoach = async (groupId: number, coachId: number, playerId: number, isAssistant: boolean) => {
  const group = await db('groups').where({ id: groupId, coach_id: coachId }).first();
  if (!group) throw new AppError('Group not found or access denied', 404);

  const member = await db('group_members').where({ group_id: groupId, player_id: playerId }).first();
  if (!member) throw new AppError('Player is not in this group', 404);

  await db('group_members')
    .where({ group_id: groupId, player_id: playerId })
    .update({ is_assistant_coach: isAssistant });

  return { message: isAssistant ? 'Assistant coach assigned' : 'Assistant coach revoked' };
};
