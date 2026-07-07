import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/auth/auth.service';
import { UserRole } from '../models/user.model';
import { IN_GAME_ROLES, InGameRole } from '../services/users/users.service';

export const registerController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, username, password, role, full_name, in_game_role, bio } = req.body;

    if (!email || !username || !password) {
      return res.status(400).json({ success: false, message: 'email, username and password are required' });
    }

    const validRoles = [UserRole.PLAYER, UserRole.COACH];
    const userRole = validRoles.includes(role) ? role : UserRole.PLAYER;

    if (in_game_role && !IN_GAME_ROLES.includes(in_game_role as InGameRole)) {
      return res.status(400).json({ success: false, message: 'Invalid in-game role' });
    }
    if (bio && String(bio).length > 500) {
      return res.status(400).json({ success: false, message: 'Bio must be at most 500 characters' });
    }

    const result = await authService.register({
      email,
      username,
      password,
      role: userRole,
      full_name: full_name ? String(full_name).trim() : null,
      // Игровая роль и био — только для игроков
      in_game_role: userRole === UserRole.PLAYER ? in_game_role || null : null,
      bio: userRole === UserRole.PLAYER ? (bio ? String(bio).trim() : null) : null,
    });

    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

export const loginController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'email and password are required' });
    }

    const result = await authService.login(email, password);

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

export const refreshController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ success: false, message: 'refreshToken is required' });
    }

    const tokens = await authService.refresh(refreshToken);

    res.json({ success: true, data: tokens });
  } catch (err) {
    next(err);
  }
};