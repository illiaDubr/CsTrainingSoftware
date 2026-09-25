import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { sendPasswordResetEmail } from '../email/email.service';
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
export const forgotPassword = async (email: string) => {
  const normalizedEmail = email.trim().toLowerCase();

  const user: User = await db('users')
    .where({ email: normalizedEmail })
    .first();

  if (!user || !user.is_active) {
    return;
  }

  await db('password_reset_tokens')
    .where({ user_id: user.id })
    .whereNull('used_at')
    .delete();

  const token = crypto.randomBytes(32).toString('hex');

  const tokenHash = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

  await db('password_reset_tokens').insert({
    user_id: user.id,
    token_hash: tokenHash,
    expires_at: new Date(Date.now() + 30 * 60 * 1000),
  });

  const frontendUrl =
    process.env.FRONTEND_URL || 'http://localhost:8081';

  const resetUrl =
    `${frontendUrl}/reset-password?token=${encodeURIComponent(token)}`;

  await sendPasswordResetEmail(user.email, resetUrl);
};

export const resetPassword = async (token: string, password: string) => {
  const tokenHash = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

  const passwordHash = await bcrypt.hash(password, 10);

  await db.transaction(async (trx) => {
    const resetToken = await trx('password_reset_tokens')
      .where({ token_hash: tokenHash })
      .whereNull('used_at')
      .where('expires_at', '>', new Date())
      .forUpdate()
      .first();

    if (!resetToken) {
      throw new AppError('Invalid or expired reset token', 400);
    }

    await trx('users')
      .where({ id: resetToken.user_id })
      .update({ password_hash: passwordHash });

    await trx('password_reset_tokens')
      .where({ user_id: resetToken.user_id })
      .delete();
  });
};