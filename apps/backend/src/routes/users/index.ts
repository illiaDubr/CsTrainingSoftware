import { Router } from 'express';
import { authenticate, authorize } from '../../middlewares/auth';
import { UserRole } from '../../models/user.model';
import {
  getMeController,
  updateMeController,
  getAllUsersController,
  getUserByIdController,
  updateUserController,
  searchPlayersController,
} from '../../controllers/users/users.controller';

const router = Router();

// Все роуты требуют авторизации
router.use(authenticate);

// Свой профиль — любая роль
router.get('/me', getMeController);
router.patch('/me', updateMeController);

// Поиск игроков — coach
router.get('/search/players', authorize(UserRole.COACH), searchPlayersController);

// Список всех пользователей — только admin
router.get('/', authorize(UserRole.ADMIN), getAllUsersController);

// Конкретный пользователь — admin
router.get('/:id', authorize(UserRole.ADMIN), getUserByIdController);

// Обновить пользователя — admin
router.patch('/:id', authorize(UserRole.ADMIN), updateUserController);

export default router;
