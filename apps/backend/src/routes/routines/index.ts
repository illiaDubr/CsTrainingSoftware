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
router.get('/personal/:playerId', authorize(UserRole.COACH), getPlayerPersonalRoutinesController);

// Групповая рутина
router.get('/', getRoutinesController);
router.post('/', authorize(UserRole.COACH), createRoutineController);

// Редактирование и удаление — владелец (тренер или игрок), проверка в сервисе
router.patch('/:id', updateRoutineController);
router.delete('/:id', deactivateRoutineController);
router.patch('/:id/progress', authorize(UserRole.PLAYER), updateRoutineProgressController);
// Тренер проставляет статус игроку за любой (в т.ч. прошлый) день
router.patch('/:id/progress/override', authorize(UserRole.COACH), overrideRoutineProgressController);

export default router;
