import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middlewares/auth';
import * as tasksService from '../../services/tasks/tasks.service';

export const getTasksController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { groupId } = req.query;
    if (!groupId) return res.status(400).json({ success: false, message: 'groupId is required' });
    const tasks = await tasksService.getTasksByGroup(Number(groupId), req.user!.userId, req.user!.role);
    res.json({ success: true, data: tasks });
  } catch (err) { next(err); }
};

export const createTaskController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { group_id, title, description, priority, due_date } = req.body;
    if (!group_id || !title) return res.status(400).json({ success: false, message: 'group_id and title are required' });
    const task = await tasksService.createTask(req.user!.userId, { group_id, title, description, priority, due_date });
    res.status(201).json({ success: true, data: task });
  } catch (err) { next(err); }
};

export const updateTaskController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { title, description, priority, due_date } = req.body;
    const task = await tasksService.updateTask(Number(req.params.id), req.user!.userId, { title, description, priority, due_date });
    res.json({ success: true, data: task });
  } catch (err) { next(err); }
};

export const deleteTaskController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await tasksService.deleteTask(Number(req.params.id), req.user!.userId);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
};

export const updateProgressController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { status, note } = req.body;
    if (!status) return res.status(400).json({ success: false, message: 'status is required' });
    const progress = await tasksService.updateProgress(Number(req.params.id), req.user!.userId, { status, note });
    res.json({ success: true, data: progress });
  } catch (err) { next(err); }
};