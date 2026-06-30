import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middlewares/auth';
import * as statsService from '../../services/stats/stats.service';

export const getPlayerActivityController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const playerId = Number(req.params.playerId);
    const result = await statsService.getPlayerActivity(playerId, req.user!.userId, req.user!.role);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
};