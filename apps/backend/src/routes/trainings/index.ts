import { Router } from 'express';
import { authenticate, authorize } from '../../middlewares/auth';
import { UserRole } from '../../models/user.model';
import {
  getTrainingsController,
  createTrainingController,
  updateTrainingController,
  deleteTrainingController,
} from '../../controllers/trainings/trainings.controller';

const router = Router();

router.use(authenticate);

router.get('/', getTrainingsController);
router.post('/', authorize(UserRole.COACH), createTrainingController);
router.patch('/:id', authorize(UserRole.COACH), updateTrainingController);
router.delete('/:id', authorize(UserRole.COACH), deleteTrainingController);

export default router;