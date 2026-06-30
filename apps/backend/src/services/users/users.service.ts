import { db } from '../../config/database';
import { AppError } from '../../middlewares/errorHandler';

export const getMe = async (userId: number) => {
  const user = await db('users')
    .where({ id: userId })
    .select('id', 'email', 'username', 'role', 'avatar_url', 'is_active')
    .first();

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
  return db('users')
    .where({ role: 'player' })
    .andWhere('username', 'ilike', `%${query}%`)
    .select('id', 'username', 'email', 'avatar_url')
    .limit(20);
};

export const updateUser = async (id: number, dto: { username?: string; is_active?: boolean }) => {
  const [user] = await db('users')
    .where({ id })
    .update({ ...dto, updated_at: db.fn.now() })
    .returning(['id', 'email', 'username', 'role', 'is_active']);

  if (!user) throw new AppError('User not found', 404);
  return user;
};