import { Router } from 'express';
import { authenticate, authorize } from '../../middlewares/auth';
import { UserRole } from '../../models/user.model';
import {
  getRoutinesController,
  createRoutineController,
  deactivateRoutineController,
  updateRoutineProgressController,
} from '../../controllers/routines/routines.controller';

const router = Router();

router.use(authenticate);

router.get('/', getRoutinesController);
router.post('/', authorize(UserRole.COACH), createRoutineController);
router.delete('/:id', authorize(UserRole.COACH), deactivateRoutineController);
router.patch('/:id/progress', authorize(UserRole.PLAYER), updateRoutineProgressController);

export default router;