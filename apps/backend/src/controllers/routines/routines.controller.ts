import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middlewares/auth';
import * as routinesService from '../../services/routines/routines.service';

export const getRoutinesController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { groupId } = req.query;
    if (!groupId) return res.status(400).json({ success: false, message: 'groupId is required' });
    const routines = await routinesService.getRoutinesByGroup(Number(groupId), req.user!.userId, req.user!.role);
    res.json({ success: true, data: routines });
  } catch (err) { next(err); }
};

export const getPersonalRoutinesController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const routines = await routinesService.getPersonalRoutines(req.user!.userId);
    res.json({ success: true, data: routines });
  } catch (err) { next(err); }
};

export const getPlayerPersonalRoutinesController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const routines = await routinesService.getPersonalRoutinesForCoach(req.user!.userId, Number(req.params.playerId));
    res.json({ success: true, data: routines });
  } catch (err) { next(err); }
};

export const createPersonalRoutineController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { title, description, priority } = req.body;
    if (!title) return res.status(400).json({ success: false, message: 'title is required' });
    const routine = await routinesService.createPersonalRoutine(req.user!.userId, { title, description, priority });
    res.status(201).json({ success: true, data: routine });
  } catch (err) { next(err); }
};

export const createRoutineController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { group_id, title, description, priority } = req.body;
    if (!group_id || !title) return res.status(400).json({ success: false, message: 'group_id and title are required' });
    const routine = await routinesService.createRoutine(req.user!.userId, { group_id, title, description, priority });
    res.status(201).json({ success: true, data: routine });
  } catch (err) { next(err); }
};

export const deactivateRoutineController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await routinesService.deactivateRoutine(Number(req.params.id), req.user!.userId);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
};

export const updateRoutineProgressController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { status, note, time_spent_minutes } = req.body;
    if (!status) return res.status(400).json({ success: false, message: 'status is required' });
    const timeSpent = time_spent_minutes !== undefined && time_spent_minutes !== null && time_spent_minutes !== ''
      ? Number(time_spent_minutes)
      : null;
    if (timeSpent !== null && (!Number.isFinite(timeSpent) || timeSpent < 0 || timeSpent > 1440)) {
      return res.status(400).json({ success: false, message: 'time_spent_minutes must be between 0 and 1440' });
    }
    const progress = await routinesService.updateRoutineProgress(Number(req.params.id), req.user!.userId, { status, note, time_spent_minutes: timeSpent });
    res.json({ success: true, data: progress });
  } catch (err) { next(err); }
};