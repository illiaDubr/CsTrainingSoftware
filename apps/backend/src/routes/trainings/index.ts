import { Router } from 'express';
import { authenticate } from '../../middlewares/auth';
import {
  getTrainingsController,
  createTrainingController,
  updateTrainingController,
  deleteTrainingController,
} from '../../controllers/trainings/trainings.controller';

const router = Router();
router.use(authenticate);
router.get('/', getTrainingsController);
// Создание/редактирование/удаление — тренер или помощник тренера этой группы (проверка в сервисе)
router.post('/', createTrainingController);
router.patch('/:id', updateTrainingController);
router.delete('/:id', deleteTrainingController);
export default router;
