import { Router } from 'express';
import {
  registerController,
  loginController,
  refreshController,
} from '../../controllers/auth.controller';

const router = Router();

router.post('/register', registerController);
router.post('/login', loginController);
router.post('/refresh', refreshController);

export default router;