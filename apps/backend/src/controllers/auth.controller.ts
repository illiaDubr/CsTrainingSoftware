import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/auth/auth.service';
import { UserRole } from '../models/user.model';

export const registerController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, username, password, role } = req.body;

    if (!email || !username || !password) {
      return res.status(400).json({ success: false, message: 'email, username and password are required' });
    }

    const validRoles = [UserRole.PLAYER, UserRole.COACH];
    const userRole = validRoles.includes(role) ? role : UserRole.PLAYER;

    const result = await authService.register({ email, username, password, role: userRole });

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