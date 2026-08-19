import bcrypt from 'bcryptjs';
import { db } from '../../config/database';
import { AppError } from '../../middlewares/errorHandler';
import { UserRole } from '../../models/user.model';

const SAFE_USER_COLUMNS = [
  'id', 'email', 'username', 'role', 'full_name', 'in_game_role', 'bio',
  'avatar_url', 'is_active', 'created_at', 'updated_at',
];

// ───────────────────────── Обзор / аналитика ─────────────────────────

export const getOverview = async () => {
  const [
    usersByRole,
    activeInactive,
    groupCount,
    nadeCount,
    tacticCount,
    materialCount,
    trainingCount,
    matchCount,
    taskCount,
    routineCount,
    signupRows,
    recentUsers,
    recentGroups,
  ] = await Promise.all([
    db('users').select('role').count('* as count').groupBy('role'),
    db('users').select('is_active').count('* as count').groupBy('is_active'),
    db('groups').count('* as count').first(),
    db('nades').count('* as count').first(),
    db('tactics').count('* as count').first(),
    db('materials').count('* as count').first(),
    db('trainings').count('* as count').first(),
    db('matches').count('* as count').first(),
    db('tasks').count('* as count').first(),
    db('routines').count('* as count').first(),
    db('users')
      .where('created_at', '>=', db.raw("now() - interval '30 days'"))
      .select(db.raw('DATE(created_at) as date'))
      .count('* as count')
      .groupByRaw('DATE(created_at)')
      .orderBy('date', 'asc'),
    db('users').select(...SAFE_USER_COLUMNS).orderBy('created_at', 'desc').limit(8),
    db('groups')
      .join('users', 'groups.coach_id', 'users.id')
      .select('groups.id', 'groups.name', 'groups.created_at', 'users.username as coach_username')
      .orderBy('groups.created_at', 'desc')
      .limit(5),
  ]);

  const roleCounts = { admin: 0, coach: 0, player: 0 } as Record<string, number>;
  usersByRole.forEach((r: any) => { roleCounts[r.role] = Number(r.count); });

  let activeCount = 0;
  let inactiveCount = 0;
  activeInactive.forEach((r: any) => {
    if (r.is_active) activeCount = Number(r.count);
    else inactiveCount = Number(r.count);
  });

  const signupMap = new Map<string, number>();
  signupRows.forEach((r: any) => {
    const d = r.date instanceof Date ? r.date : new Date(r.date);
    signupMap.set(d.toISOString().split('T')[0], Number(r.count));
  });
  const signupSeries: { date: string; count: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    signupSeries.push({ date: key, count: signupMap.get(key) ?? 0 });
  }

  return {
    users: {
      total: activeCount + inactiveCount,
      active: activeCount,
      inactive: inactiveCount,
      admin: roleCounts.admin ?? 0,
      coach: roleCounts.coach ?? 0,
      player: roleCounts.player ?? 0,
    },
    groups: Number(groupCount?.count ?? 0),
    content: {
      nades: Number(nadeCount?.count ?? 0),
      tactics: Number(tacticCount?.count ?? 0),
      materials: Number(materialCount?.count ?? 0),
      trainings: Number(trainingCount?.count ?? 0),
      matches: Number(matchCount?.count ?? 0),
      tasks: Number(taskCount?.count ?? 0),
      routines: Number(routineCount?.count ?? 0),
    },
    signupSeries,
    recentUsers,
    recentGroups,
  };
};

// ───────────────────────── Пользователи ─────────────────────────

export const listUsers = async (filters: { role?: string; q?: string; status?: string }) => {
  const qb = db('users').select(...SAFE_USER_COLUMNS).orderBy('created_at', 'desc');

  if (filters.role && ['admin', 'coach', 'player'].includes(filters.role)) {
    qb.where('role', filters.role);
  }
  if (filters.status === 'active') qb.where('is_active', true);
  if (filters.status === 'banned') qb.where('is_active', false);
  if (filters.q) {
    const q = `%${filters.q.trim()}%`;
    qb.andWhere((b) => {
      b.where('username', 'ilike', q).orWhere('email', 'ilike', q).orWhere('full_name', 'ilike', q);
    });
  }

  return qb;
};

export const getUserDetail = async (id: number) => {
  const user = await db('users').where({ id }).select(...SAFE_USER_COLUMNS).first();
  if (!user) throw new AppError('User not found', 404);

  const memberOf = await db('group_members')
    .join('groups', 'group_members.group_id', 'groups.id')
    .where({ 'group_members.player_id': id })
    .select('groups.id', 'groups.name', 'group_members.is_assistant_coach');

  const coaches = await db('groups').where({ coach_id: id }).select('id', 'name', 'created_at');

  const [nadeCount, tacticCount, materialCount, trainingCount, matchCount] = await Promise.all([
    db('nades').where({ coach_id: id }).count('* as count').first(),
    db('tactics').where({ coach_id: id }).count('* as count').first(),
    db('materials').where({ coach_id: id }).count('* as count').first(),
    db('trainings').where({ coach_id: id }).count('* as count').first(),
    db('matches').where({ created_by: id }).count('* as count').first(),
  ]);

  return {
    ...user,
    memberOf,
    coaches,
    contentCounts: {
      nades: Number(nadeCount?.count ?? 0),
      tactics: Number(tacticCount?.count ?? 0),
      materials: Number(materialCount?.count ?? 0),
      trainings: Number(trainingCount?.count ?? 0),
      matches: Number(matchCount?.count ?? 0),
    },
  };
};

export const adminUpdateUser = async (id: number, dto: {
  username?: string;
  full_name?: string | null;
  in_game_role?: string | null;
  bio?: string | null;
  role?: string;
  is_active?: boolean;
  password?: string;
}) => {
  const existing = await db('users').where({ id }).first();
  if (!existing) throw new AppError('User not found', 404);

  const update: Record<string, unknown> = {};

  if (dto.username !== undefined) {
    const username = String(dto.username).trim();
    if (username.length < 2) throw new AppError('Username must be at least 2 characters', 400);
    update.username = username;
  }
  if (dto.full_name !== undefined) update.full_name = dto.full_name ? String(dto.full_name).trim() : null;
  if (dto.in_game_role !== undefined) update.in_game_role = dto.in_game_role || null;
  if (dto.bio !== undefined) update.bio = dto.bio ? String(dto.bio) : null;
  if (dto.is_active !== undefined) update.is_active = !!dto.is_active;

  if (dto.role !== undefined) {
    if (!Object.values(UserRole).includes(dto.role as UserRole)) {
      throw new AppError('Invalid role', 400);
    }
    update.role = dto.role;
  }

  if (dto.password !== undefined && dto.password !== '') {
    if (String(dto.password).length < 6) throw new AppError('Password must be at least 6 characters', 400);
    update.password_hash = await bcrypt.hash(String(dto.password), 10);
  }

  if (Object.keys(update).length === 0) {
    return db('users').where({ id }).select(...SAFE_USER_COLUMNS).first();
  }

  const [user] = await db('users')
    .where({ id })
    .update({ ...update, updated_at: db.fn.now() })
    .returning(SAFE_USER_COLUMNS);

  return user;
};

// ───────────────────────── Группы ─────────────────────────

export const listGroups = async () => {
  const groups = await db('groups')
    .join('users', 'groups.coach_id', 'users.id')
    .select(
      'groups.id', 'groups.name', 'groups.description', 'groups.coach_id', 'groups.created_at',
      'users.username as coach_username', 'users.email as coach_email'
    )
    .orderBy('groups.created_at', 'desc');

  const memberCounts = await db('group_members').select('group_id').count('* as count').groupBy('group_id');
  const countMap = new Map<number, number>();
  memberCounts.forEach((r: any) => countMap.set(r.group_id, Number(r.count)));

  return groups.map((g: any) => ({ ...g, member_count: countMap.get(g.id) ?? 0 }));
};

export const getGroupDetail = async (id: number) => {
  const group = await db('groups')
    .join('users', 'groups.coach_id', 'users.id')
    .where('groups.id', id)
    .select(
      'groups.id', 'groups.name', 'groups.description', 'groups.coach_id', 'groups.created_at', 'groups.updated_at',
      'users.username as coach_username', 'users.email as coach_email'
    )
    .first();
  if (!group) throw new AppError('Group not found', 404);

  const members = await db('users')
    .join('group_members', 'users.id', 'group_members.player_id')
    .where({ 'group_members.group_id': id })
    .select('users.id', 'users.username', 'users.email', 'users.avatar_url', 'users.is_active', 'group_members.is_assistant_coach');

  const [nadeCount, tacticCount, materialCount, trainingCount, matchCount, taskCount, routineCount] = await Promise.all([
    db('nades').where({ group_id: id }).count('* as count').first(),
    db('tactics').where({ group_id: id }).count('* as count').first(),
    db('materials').where({ group_id: id }).count('* as count').first(),
    db('trainings').where({ group_id: id }).count('* as count').first(),
    db('matches').where({ group_id: id }).count('* as count').first(),
    db('tasks').where({ group_id: id }).count('* as count').first(),
    db('routines').where({ group_id: id }).count('* as count').first(),
  ]);

  return {
    ...group,
    members,
    contentCounts: {
      nades: Number(nadeCount?.count ?? 0),
      tactics: Number(tacticCount?.count ?? 0),
      materials: Number(materialCount?.count ?? 0),
      trainings: Number(trainingCount?.count ?? 0),
      matches: Number(matchCount?.count ?? 0),
      tasks: Number(taskCount?.count ?? 0),
      routines: Number(routineCount?.count ?? 0),
    },
  };
};

export const adminUpdateGroup = async (id: number, dto: { name?: string; description?: string; coach_id?: number }) => {
  const group = await db('groups').where({ id }).first();
  if (!group) throw new AppError('Group not found', 404);

  const update: Record<string, unknown> = {};
  if (dto.name !== undefined) {
    const name = String(dto.name).trim();
    if (!name) throw new AppError('Name is required', 400);
    update.name = name;
  }
  if (dto.description !== undefined) update.description = dto.description || null;
  if (dto.coach_id !== undefined) {
    const coach = await db('users').where({ id: dto.coach_id, role: 'coach' }).first();
    if (!coach) throw new AppError('Coach not found', 404);
    update.coach_id = dto.coach_id;
  }

  const [updated] = await db('groups')
    .where({ id })
    .update({ ...update, updated_at: db.fn.now() })
    .returning('*');
  return updated;
};

export const adminDeleteGroup = async (id: number) => {
  const group = await db('groups').where({ id }).first();
  if (!group) throw new AppError('Group not found', 404);
  await db('groups').where({ id }).delete();
  return { message: 'Group deleted' };
};

export const adminSetAssistantCoach = async (groupId: number, playerId: number, isAssistant: boolean) => {
  const group = await db('groups').where({ id: groupId }).first();
  if (!group) throw new AppError('Group not found', 404);

  const member = await db('group_members').where({ group_id: groupId, player_id: playerId }).first();
  if (!member) throw new AppError('Player is not in this group', 404);

  await db('group_members')
    .where({ group_id: groupId, player_id: playerId })
    .update({ is_assistant_coach: isAssistant });

  return { message: isAssistant ? 'Assistant coach assigned' : 'Assistant coach revoked' };
};

export const listCoaches = async () => {
  return db('users').where({ role: 'coach' }).select('id', 'username', 'email').orderBy('username', 'asc');
};

// ───────────────────────── Контент (все группы) ─────────────────────────

export const listAllNades = async (filters: { mapName?: string; groupId?: number; q?: string }) => {
  const qb = db('nades')
    .leftJoin('groups', 'nades.group_id', 'groups.id')
    .join('users', 'nades.coach_id', 'users.id')
    .select(
      'nades.id', 'nades.title', 'nades.map_name', 'nades.side', 'nades.category', 'nades.nade_type',
      'nades.group_id', 'nades.created_at',
      'groups.name as group_name', 'users.username as coach_username'
    )
    .orderBy('nades.created_at', 'desc');

  if (filters.mapName) qb.where('nades.map_name', filters.mapName);
  if (filters.groupId) qb.where('nades.group_id', filters.groupId);
  if (filters.q) qb.andWhere('nades.title', 'ilike', `%${filters.q.trim()}%`);

  return qb;
};

export const listAllTactics = async (filters: { mapName?: string; groupId?: number; q?: string }) => {
  const qb = db('tactics')
    .join('groups', 'tactics.group_id', 'groups.id')
    .join('users', 'tactics.coach_id', 'users.id')
    .select(
      'tactics.id', 'tactics.title', 'tactics.map_name', 'tactics.side', 'tactics.group_id', 'tactics.created_at',
      'groups.name as group_name', 'users.username as coach_username'
    )
    .orderBy('tactics.created_at', 'desc');

  if (filters.mapName) qb.where('tactics.map_name', filters.mapName);
  if (filters.groupId) qb.where('tactics.group_id', filters.groupId);
  if (filters.q) qb.andWhere('tactics.title', 'ilike', `%${filters.q.trim()}%`);

  return qb;
};

export const listAllMaterials = async (filters: { groupId?: number; q?: string }) => {
  const qb = db('materials')
    .join('groups', 'materials.group_id', 'groups.id')
    .leftJoin('users', 'materials.coach_id', 'users.id')
    .select(
      'materials.id', 'materials.title', 'materials.type', 'materials.external_url', 'materials.file_url',
      'materials.group_id', 'materials.created_at',
      'groups.name as group_name', 'users.username as coach_username'
    )
    .orderBy('materials.created_at', 'desc');

  if (filters.groupId) qb.where('materials.group_id', filters.groupId);
  if (filters.q) qb.andWhere('materials.title', 'ilike', `%${filters.q.trim()}%`);

  return qb;
};

export const listAllTrainings = async (filters: { groupId?: number; q?: string }) => {
  const qb = db('trainings')
    .join('groups', 'trainings.group_id', 'groups.id')
    .leftJoin('users', 'trainings.coach_id', 'users.id')
    .select(
      'trainings.id', 'trainings.title', 'trainings.scheduled_at', 'trainings.duration_minutes',
      'trainings.group_id', 'trainings.created_at',
      'groups.name as group_name', 'users.username as coach_username'
    )
    .orderBy('trainings.scheduled_at', 'desc');

  if (filters.groupId) qb.where('trainings.group_id', filters.groupId);
  if (filters.q) qb.andWhere('trainings.title', 'ilike', `%${filters.q.trim()}%`);

  return qb;
};

export const listAllMatches = async (filters: { groupId?: number; q?: string }) => {
  const qb = db('matches')
    .join('groups', 'matches.group_id', 'groups.id')
    .join('users', 'matches.created_by', 'users.id')
    .select(
      'matches.id', 'matches.opponent', 'matches.match_class', 'matches.scheduled_at',
      'matches.group_id', 'matches.created_at',
      'groups.name as group_name', 'users.username as created_by_username'
    )
    .orderBy('matches.scheduled_at', 'desc');

  if (filters.groupId) qb.where('matches.group_id', filters.groupId);
  if (filters.q) qb.andWhere('matches.opponent', 'ilike', `%${filters.q.trim()}%`);

  return qb;
};
