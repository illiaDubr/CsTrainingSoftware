import { Router } from 'express';
import { authenticate } from '../../middlewares/auth';
import {
  getMaterialsController,
  createMaterialController,
  updateMaterialController,
  deleteMaterialController,
} from '../../controllers/materials/materials.controller';

const router = Router();
router.use(authenticate);
router.get('/', getMaterialsController);
// Создание/редактирование/удаление — тренер или помощник тренера этой группы (проверка в сервисе)
router.post('/', createMaterialController);
router.patch('/:id', updateMaterialController);
router.delete('/:id', deleteMaterialController);
export default router;
