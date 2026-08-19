import { Router } from 'express';
import { authenticate, authorize } from '../../middlewares/auth';
import { UserRole } from '../../models/user.model';
import {
  getOverviewController,
  listUsersController,
  getUserDetailController,
  updateUserController,
  listGroupsController,
  listCoachesController,
  getGroupDetailController,
  updateGroupController,
  deleteGroupController,
  removeMemberController,
  setAssistantController,
  listNadesController,
  deleteNadeController,
  listTacticsController,
  deleteTacticController,
  listMaterialsController,
  deleteMaterialController,
  listTrainingsController,
  deleteTrainingController,
  listMatchesController,
  deleteMatchController,
} from '../../controllers/admin/admin.controller';

const router = Router();

// Всё в этом модуле — только для роли admin
router.use(authenticate, authorize(UserRole.ADMIN));

router.get('/overview', getOverviewController);

router.get('/users', listUsersController);
router.get('/users/:id', getUserDetailController);
router.patch('/users/:id', updateUserController);

router.get('/groups', listGroupsController);
router.get('/coaches', listCoachesController);
router.get('/groups/:id', getGroupDetailController);
router.patch('/groups/:id', updateGroupController);
router.delete('/groups/:id', deleteGroupController);
router.delete('/groups/:id/members/:playerId', removeMemberController);
router.patch('/groups/:id/members/:playerId/assistant', setAssistantController);

router.get('/nades', listNadesController);
router.delete('/nades/:id', deleteNadeController);

router.get('/tactics', listTacticsController);
router.delete('/tactics/:id', deleteTacticController);

router.get('/materials', listMaterialsController);
router.delete('/materials/:id', deleteMaterialController);

router.get('/trainings', listTrainingsController);
router.delete('/trainings/:id', deleteTrainingController);

router.get('/matches', listMatchesController);
router.delete('/matches/:id', deleteMatchController);

export default router;
