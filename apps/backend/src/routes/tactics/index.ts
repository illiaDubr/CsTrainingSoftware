import { Router } from 'express';
import { authenticate } from '../../middlewares/auth';
import {
  getTacticsController,
  getTacticController,
  createTacticController,
  updateTacticController,
  deleteTacticController,
} from '../../controllers/tactics/tactics.controller';

const router = Router();

router.use(authenticate);

// Просмотр — любой участник группы
router.get('/', getTacticsController);
router.get('/:id', getTacticController);

// Управление — тренер или помощник тренера этой группы (проверка в сервисе)
router.post('/', createTacticController);
router.patch('/:id', updateTacticController);
router.delete('/:id', deleteTacticController);

export default router;
