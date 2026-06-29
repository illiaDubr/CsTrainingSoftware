import { Router } from 'express';
import { authenticate, authorize } from '../../middlewares/auth';
import { UserRole } from '../../models/user.model';
import {
  getTasksController,
  createTaskController,
  updateTaskController,
  deleteTaskController,
  updateProgressController,
} from '../../controllers/tasks/tasks.controller';

const router = Router();

router.use(authenticate);

// Задачи группы — все роли
router.get('/', getTasksController);

// Создать задачу — только coach
router.post('/', authorize(UserRole.COACH), createTaskController);

// Обновить задачу — только coach
router.patch('/:id', authorize(UserRole.COACH), updateTaskController);

// Удалить задачу — только coach
router.delete('/:id', authorize(UserRole.COACH), deleteTaskController);

// Обновить прогресс — только player
router.patch('/:id/progress', authorize(UserRole.PLAYER), updateProgressController);

export default router;