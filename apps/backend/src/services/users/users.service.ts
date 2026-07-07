import { db } from '../../config/database';
import { AppError } from '../../middlewares/errorHandler';

export const IN_GAME_ROLES = ['captain', 'entry', 'anchor', 'rifler', 'support'] as const;
export type InGameRole = (typeof IN_GAME_ROLES)[number];

export const getMe = async (userId: number) => {
  const user = await db('users')
    .where({ id: userId })
    .select('id', 'email', 'username', 'role', 'avatar_url', 'is_active', 'in_game_role', 'bio', 'full_name')
    .first();

  if (!user) throw new AppError('User not found', 404);
  return user;
};

export const updateMe = async (
  userId: number,
  dto: { username?: string; full_name?: string | null; in_game_role?: string | null; bio?: string | null }
) => {
  if (dto.username !== undefined) {
    const username = String(dto.username).trim();
    if (username.length < 2) throw new AppError('Username must be at least 2 characters', 400);
    dto.username = username;
  }

  if (dto.in_game_role !== undefined && dto.in_game_role !== null && dto.in_game_role !== '') {
    if (!IN_GAME_ROLES.includes(dto.in_game_role as InGameRole)) {
      throw new AppError('Invalid in-game role', 400);
    }
  }

  if (dto.bio !== undefined && dto.bio !== null && String(dto.bio).length > 500) {
    throw new AppError('Bio must be at most 500 characters', 400);
  }

  if (dto.full_name !== undefined && dto.full_name !== null) {
    const fullName = String(dto.full_name).trim();
    dto.full_name = fullName || null;
  }

  const [user] = await db('users')
    .where({ id: userId })
    .update({ ...dto, updated_at: db.fn.now() })
    .returning(['id', 'email', 'username', 'role', 'avatar_url', 'is_active', 'in_game_role', 'bio', 'full_name']);

  if (!user) throw new AppError('User not found', 404);
  return user;
};

export const getAllUsers = async () => {
  return db('users')
    .select('id', 'email', 'username', 'role', 'avatar_url', 'is_active', 'created_at')
    .orderBy('created_at', 'desc');
};

export const getUserById = async (id: number) => {
  const user = await db('users')
    .where({ id })
    .select('id', 'email', 'username', 'role', 'avatar_url', 'is_active', 'created_at')
    .first();

  if (!user) throw new AppError('User not found', 404);
  return user;
};

export const searchPlayers = async (query: string) => {
  const qb = db('users')
    .where({ role: 'player' })
    .select('id', 'username', 'email', 'avatar_url', 'in_game_role')
    .orderBy('username', 'asc')
    .limit(100);

  if (query) {
    qb.andWhere('username', 'ilike', `%${query}%`);
  }

  return qb;
};

export const updateUser = async (id: number, dto: { username?: string; is_active?: boolean }) => {
  const [user] = await db('users')
    .where({ id })
    .update({ ...dto, updated_at: db.fn.now() })
    .returning(['id', 'email', 'username', 'role', 'is_active']);

  if (!user) throw new AppError('User not found', 404);
  return user;
};