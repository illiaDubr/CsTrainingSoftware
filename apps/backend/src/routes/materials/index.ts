import { Router } from 'express';
import { authenticate, authorize } from '../../middlewares/auth';
import { UserRole } from '../../models/user.model';
import {
  getMaterialsController,
  createMaterialController,
  updateMaterialController,
  deleteMaterialController,
} from '../../controllers/materials/materials.controller';

const router = Router();

router.use(authenticate);

router.get('/', getMaterialsController);
router.post('/', authorize(UserRole.COACH), createMaterialController);
router.patch('/:id', authorize(UserRole.COACH), updateMaterialController);
router.delete('/:id', authorize(UserRole.COACH), deleteMaterialController);

export default router;