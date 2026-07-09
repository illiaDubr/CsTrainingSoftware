import { Router } from 'express';
import { authenticate, authorize } from '../../middlewares/auth';
import { UserRole } from '../../models/user.model';
import {
  getActiveMapsController,
  createMapController,
  deleteMapController,
} from '../../controllers/maps/maps.controller';

const router = Router();

router.use(authenticate);

// Активные карты дня (для любой роли)
router.get('/current', getActiveMapsController);

// Назначить / снять карту — тренер
router.post('/', authorize(UserRole.COACH), createMapController);
router.delete('/:id', authorize(UserRole.COACH), deleteMapController);

export default router;
