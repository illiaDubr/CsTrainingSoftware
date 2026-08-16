import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middlewares/auth';
import * as tacticsService from '../../services/tactics/tactics.service';

const SIDES = ['T', 'CT'];

export const getTacticsController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { groupId } = req.query;
    if (!groupId) return res.status(400).json({ success: false, message: 'groupId is required' });
    const tactics = await tacticsService.getTactics(Number(groupId), req.user!.userId, req.user!.role);
    res.json({ success: true, data: tactics });
  } catch (err) { next(err); }
};

export const getTacticController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const tactic = await tacticsService.getTacticById(Number(req.params.id), req.user!.userId, req.user!.role);
    res.json({ success: true, data: tactic });
  } catch (err) { next(err); }
};

export const createTacticController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { group_id, title, map_name, side, description, movement_arrows, nade_ids } = req.body;
    if (!group_id) return res.status(400).json({ success: false, message: 'group_id is required' });
    if (!title || !String(title).trim()) {
      return res.status(400).json({ success: false, message: 'title is required' });
    }
    if (!map_name || !String(map_name).trim()) {
      return res.status(400).json({ success: false, message: 'map_name is required' });
    }
    if (!SIDES.includes(side)) return res.status(400).json({ success: false, message: 'invalid side' });

    const tactic = await tacticsService.createTactic(Number(group_id), req.user!.userId, req.user!.role, {
      title,
      map_name,
      side,
      description,
      movement_arrows: Array.isArray(movement_arrows) ? movement_arrows : undefined,
      nade_ids: Array.isArray(nade_ids) ? nade_ids.map(Number) : undefined,
    });
    res.status(201).json({ success: true, data: tactic });
  } catch (err) { next(err); }
};

export const updateTacticController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { title, map_name, side, description, movement_arrows, nade_ids } = req.body;
    if (side !== undefined && !SIDES.includes(side)) return res.status(400).json({ success: false, message: 'invalid side' });
    if (title !== undefined && !String(title).trim()) {
      return res.status(400).json({ success: false, message: 'title cannot be empty' });
    }

    const tactic = await tacticsService.updateTactic(Number(req.params.id), req.user!.userId, req.user!.role, {
      title,
      map_name,
      side,
      description,
      movement_arrows: Array.isArray(movement_arrows) ? movement_arrows : undefined,
      nade_ids: Array.isArray(nade_ids) ? nade_ids.map(Number) : undefined,
    });
    res.json({ success: true, data: tactic });
  } catch (err) { next(err); }
};

export const deleteTacticController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await tacticsService.deleteTactic(Number(req.params.id), req.user!.userId, req.user!.role);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
};
