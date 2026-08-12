import { Router } from 'express';
import { authenticate } from '../../middlewares/auth';
import {
  getMatchesController,
  getMatchByIdController,
  createMatchController,
  updateMatchController,
  deleteMatchController,
} from '../../controllers/matches/matches.controller';

const router = Router();
router.use(authenticate);

// Любой авторизованный участник группы (тренер или игрок) может смотреть и добавлять матчи
router.get('/', getMatchesController);
router.get('/:id', getMatchByIdController);
router.post('/', createMatchController);

// Редактировать/удалять может автор матча или тренер группы (проверка в сервисе)
router.patch('/:id', updateMatchController);
router.delete('/:id', deleteMatchController);

export default router;
