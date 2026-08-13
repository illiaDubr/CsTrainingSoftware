import { Router } from 'express';
import { authenticate, authorize } from '../../middlewares/auth';
import { UserRole } from '../../models/user.model';
import {
  getRoutinesController,
  getPersonalRoutinesController,
  getPlayerPersonalRoutinesController,
  createPersonalRoutineController,
  createRoutineController,
  updateRoutineController,
  deactivateRoutineController,
  updateRoutineProgressController,
  overrideRoutineProgressController,
} from '../../controllers/routines/routines.controller';

const router = Router();

router.use(authenticate);

// Индивидуальная рутина
router.get('/personal', authorize(UserRole.PLAYER), getPersonalRoutinesController);
router.post('/personal', authorize(UserRole.PLAYER), createPersonalRoutineController);
// Просмотр личной рутины игрока — тренер или помощник тренера общей группы (проверка в сервисе)
router.get('/personal/:playerId', getPlayerPersonalRoutinesController);

// Групповая рутина
router.get('/', getRoutinesController);
// Создать групповую рутину — тренер или помощник тренера этой группы (проверка в сервисе)
router.post('/', createRoutineController);

// Редактирование и удаление — владелец (тренер/помощник или игрок), проверка в сервисе
router.patch('/:id', updateRoutineController);
router.delete('/:id', deactivateRoutineController);
router.patch('/:id/progress', authorize(UserRole.PLAYER), updateRoutineProgressController);
// Тренер или помощник проставляет статус игроку за любой (в т.ч. прошлый) день
router.patch('/:id/progress/override', overrideRoutineProgressController);

export default router;
