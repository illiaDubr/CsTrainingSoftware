import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middlewares/auth';
import * as matchesService from '../../services/matches/matches.service';

const MATCH_CLASSES = ['esea', 'other'];

export const getMatchesController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { groupId } = req.query;
    if (!groupId) return res.status(400).json({ success: false, message: 'groupId is required' });

    const matches = await matchesService.getMatchesByGroup(Number(groupId), req.user!.userId, req.user!.role);
    res.json({ success: true, data: matches });
  } catch (err) { next(err); }
};

export const getMatchByIdController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const match = await matchesService.getMatchById(Number(req.params.id), req.user!.userId, req.user!.role);
    res.json({ success: true, data: match });
  } catch (err) { next(err); }
};

export const createMatchController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { group_id, match_class, opponent, scheduled_at, note } = req.body;

    if (!group_id) return res.status(400).json({ success: false, message: 'group_id is required' });
    if (!opponent || !String(opponent).trim()) {
      return res.status(400).json({ success: false, message: 'opponent is required' });
    }
    if (!MATCH_CLASSES.includes(match_class)) {
      return res.status(400).json({ success: false, message: 'invalid match_class' });
    }
    if (!scheduled_at || isNaN(Date.parse(scheduled_at))) {
      return res.status(400).json({ success: false, message: 'valid scheduled_at is required' });
    }

    const match = await matchesService.createMatch(req.user!.userId, req.user!.role, {
      group_id: Number(group_id), match_class, opponent, scheduled_at, note,
    });
    res.status(201).json({ success: true, data: match });
  } catch (err) { next(err); }
};

export const updateMatchController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { match_class, opponent, scheduled_at, note } = req.body;

    if (match_class !== undefined && !MATCH_CLASSES.includes(match_class)) {
      return res.status(400).json({ success: false, message: 'invalid match_class' });
    }
    if (opponent !== undefined && !String(opponent).trim()) {
      return res.status(400).json({ success: false, message: 'opponent cannot be empty' });
    }
    if (scheduled_at !== undefined && isNaN(Date.parse(scheduled_at))) {
      return res.status(400).json({ success: false, message: 'invalid scheduled_at' });
    }

    const match = await matchesService.updateMatch(Number(req.params.id), req.user!.userId, req.user!.role, {
      match_class, opponent, scheduled_at, note,
    });
    res.json({ success: true, data: match });
  } catch (err) { next(err); }
};

export const deleteMatchController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await matchesService.deleteMatch(Number(req.params.id), req.user!.userId, req.user!.role);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
};
