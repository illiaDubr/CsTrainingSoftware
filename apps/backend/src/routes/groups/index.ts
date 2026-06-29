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
} from '../../controllers/groups/groups.controller';

const router = Router();

router.use(authenticate);

// Свои группы — все роли
router.get('/', getMyGroupsController);

// Конкретная группа — все роли
router.get('/:id', getGroupByIdController);

// Создать группу — только coach
router.post('/', authorize(UserRole.COACH), createGroupController);

// Обновить группу — только coach
router.patch('/:id', authorize(UserRole.COACH), updateGroupController);

// Добавить игрока в группу — только coach
router.post('/:id/members', authorize(UserRole.COACH), addMemberController);

// Удалить игрока из группы — только coach
router.delete('/:id/members/:playerId', authorize(UserRole.COACH), removeMemberController);

export default router;