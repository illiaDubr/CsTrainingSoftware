import { Router } from 'express';
import { authenticate, authorize } from '../../middlewares/auth';
import { UserRole } from '../../models/user.model';
import {
  getMyGroupsController,
  getGroupByIdController,
  createGroupController,
  updateGroupController,
  addMemberController,
  removeMemberController,
  setAssistantCoachController,
} from '../../controllers/groups/groups.controller';

const router = Router();

router.use(authenticate);

// Свои группы — все роли
router.get('/', getMyGroupsController);

// Конкретная группа — все роли
router.get('/:id', getGroupByIdController);

// Создать группу — только coach
router.post('/', authorize(UserRole.COACH), createGroupController);

// Обновить группу — тренер или помощник тренера этой группы (проверка в сервисе)
router.patch('/:id', updateGroupController);

// Добавить игрока в группу — тренер или помощник тренера этой группы (проверка в сервисе)
router.post('/:id/members', addMemberController);

// Удалить игрока из группы — тренер или помощник тренера этой группы (проверка в сервисе)
router.delete('/:id/members/:playerId', removeMemberController);

// Назначить/снять помощника тренера — только реальный тренер группы
router.patch('/:id/members/:playerId/assistant', authorize(UserRole.COACH), setAssistantCoachController);

export default router;
