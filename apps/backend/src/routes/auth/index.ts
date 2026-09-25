import { Router } from 'express';
import {
  registerController,
  loginController,
  refreshController,
  forgotPasswordController,
  resetPasswordController,
} from '../../controllers/auth.controller';

const router = Router();

router.post('/register', registerController);
router.post('/login', loginController);
router.post('/refresh', refreshController);
router.post('/forgot-password', forgotPasswordController);
router.post('/reset-password', resetPasswordController);

export default router;