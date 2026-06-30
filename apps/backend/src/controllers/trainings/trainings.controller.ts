import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middlewares/auth';
import * as trainingsService from '../../services/trainings/trainings.service';

export const getTrainingsController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { groupId } = req.query;
    if (!groupId) return res.status(400).json({ success: false, message: 'groupId is required' });
    const trainings = await trainingsService.getTrainings(Number(groupId));
    res.json({ success: true, data: trainings });
  } catch (err) { next(err); }
};

export const createTrainingController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { group_id, title, description, scheduled_at, duration_minutes } = req.body;
    if (!group_id || !title || !scheduled_at) {
      return res.status(400).json({ success: false, message: 'group_id, title and scheduled_at are required' });
    }
    const training = await trainingsService.createTraining(req.user!.userId, { group_id, title, description, scheduled_at, duration_minutes });
    res.status(201).json({ success: true, data: training });
  } catch (err) { next(err); }
};

export const updateTrainingController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { title, description, scheduled_at, duration_minutes } = req.body;
    const training = await trainingsService.updateTraining(Number(req.params.id), req.user!.userId, { title, description, scheduled_at, duration_minutes });
    res.json({ success: true, data: training });
  } catch (err) { next(err); }
};

export const deleteTrainingController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await trainingsService.deleteTraining(Number(req.params.id), req.user!.userId);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
};