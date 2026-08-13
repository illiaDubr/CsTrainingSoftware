import { Router } from 'express';
import { authenticate } from '../../middlewares/auth';
import {
  getActiveMapController,
  createMapController,
  deleteMapController,
} from '../../controllers/maps/maps.controller';

const router = Router();

router.use(authenticate);

// Активная карта дня группы — любой участник группы
router.get('/current', getActiveMapController);

// Назначить / снять карту — тренер или помощник тренера этой группы (проверка в сервисе)
router.post('/', createMapController);
router.delete('/:id', deleteMapController);

export default router;
