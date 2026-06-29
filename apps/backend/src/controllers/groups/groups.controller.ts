import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middlewares/auth';
import * as groupsService from '../../services/groups/groups.service';

export const getMyGroupsController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const groups = await groupsService.getMyGroups(req.user!.userId, req.user!.role);
    res.json({ success: true, data: groups });
  } catch (err) { next(err); }
};

export const getGroupByIdController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const group = await groupsService.getGroupById(Number(req.params.id));
    res.json({ success: true, data: group });
  } catch (err) { next(err); }
};

export const createGroupController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'name is required' });
    const group = await groupsService.createGroup(req.user!.userId, { name, description });
    res.status(201).json({ success: true, data: group });
  } catch (err) { next(err); }
};

export const updateGroupController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { name, description } = req.body;
    const group = await groupsService.updateGroup(Number(req.params.id), req.user!.userId, { name, description });
    res.json({ success: true, data: group });
  } catch (err) { next(err); }
};

export const addMemberController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { playerId } = req.body;
    if (!playerId) return res.status(400).json({ success: false, message: 'playerId is required' });
    const result = await groupsService.addMember(Number(req.params.id), req.user!.userId, Number(playerId));
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
};

export const removeMemberController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await groupsService.removeMember(Number(req.params.id), req.user!.userId, Number(req.params.playerId));
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
};