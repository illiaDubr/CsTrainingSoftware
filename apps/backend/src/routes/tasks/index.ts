import { Router } from 'express';
import { authenticate, authorize } from '../../middlewares/auth';
import { UserRole } from '../../models/user.model';
import {
  getTasksController,
  getTaskByIdController,
  createTaskController,
  updateTaskController,
  deleteTaskController,
  updateProgressController,
} from '../../controllers/tasks/tasks.controller';

const router = Router();

router.use(authenticate);

// Задачи группы — все роли
router.get('/', getTasksController);

router.get('/:id', getTaskByIdController);
// Создать задачу — тренер или помощник тренера этой группы (проверка в сервисе)
router.post('/', createTaskController);

// Обновить задачу — тренер или помощник тренера этой группы (проверка в сервисе)
router.patch('/:id', updateTaskController);

// Удалить задачу — тренер или помощник тренера этой группы (проверка в сервисе)
router.delete('/:id', deleteTaskController);

// Обновить прогресс — только player
router.patch('/:id/progress', authorize(UserRole.PLAYER), updateProgressController);

export default router;
