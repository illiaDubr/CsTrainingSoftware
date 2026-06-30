import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middlewares/auth';
import * as usersService from '../../services/users/users.service';

export const getMeController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await usersService.getMe(req.user!.userId);
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

export const getAllUsersController = async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const users = await usersService.getAllUsers();
    res.json({ success: true, data: users });
  } catch (err) {
    next(err);
  }
};

export const getUserByIdController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await usersService.getUserById(Number(req.params.id));
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

export const searchPlayersController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { q } = req.query;
    if (!q || String(q).length < 2) {
      return res.json({ success: true, data: [] });
    }
    const players = await usersService.searchPlayers(String(q));
    res.json({ success: true, data: players });
  } catch (err) {
    next(err);
  }
};

export const updateUserController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { username, is_active } = req.body;
    const user = await usersService.updateUser(Number(req.params.id), { username, is_active });
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};