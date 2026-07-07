import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../../config/database';
import { config } from '../../config/app';
import { AppError } from '../../middlewares/errorHandler';
import { User, CreateUserDto, UserRole } from '../../models/user.model';
import { JwtPayload } from '../../middlewares/auth';

const generateTokens = (userId: number, role: UserRole) => {
  const accessToken = jwt.sign(
    { userId, role } as JwtPayload,
    config.jwt.secret,
    { expiresIn: 60 * 60 * 24 * 7 } // 7 дней в секундах
  );

  const refreshToken = jwt.sign(
    { userId, role } as JwtPayload,
    config.jwt.refreshSecret,
    { expiresIn: 60 * 60 * 24 * 30 } // 30 дней в секундах
  );

  return { accessToken, refreshToken };
};

export const register = async (dto: CreateUserDto) => {
  const existing = await db('users').where({ email: dto.email }).first();
  if (existing) {
    throw new AppError('Email already in use', 409);
  }

  const password_hash = await bcrypt.hash(dto.password, 10);

  const [user] = await db('users')
    .insert({
      email: dto.email,
      username: dto.username,
      password_hash,
      role: dto.role,
      full_name: dto.full_name || null,
      in_game_role: dto.in_game_role || null,
      bio: dto.bio || null,
    })
    .returning(['id', 'email', 'username', 'role', 'full_name', 'in_game_role', 'bio']);

  const tokens = generateTokens(user.id, user.role);

  return { user, ...tokens };
};

export const login = async (email: string, password: string) => {
  const user: User = await db('users').where({ email }).first();

  if (!user || !user.is_active) {
    throw new AppError('Invalid credentials', 401);
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    throw new AppError('Invalid credentials', 401);
  }

  const tokens = generateTokens(user.id, user.role);

  return {
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
    },
    ...tokens,
  };
};

export const refresh = async (refreshToken: string) => {
  try {
    const payload = jwt.verify(refreshToken, config.jwt.refreshSecret) as JwtPayload;
    const tokens = generateTokens(payload.userId, payload.role);
    return tokens;
  } catch {
    throw new AppError('Invalid refresh token', 401);
  }
};