import { Router } from 'express';
import { authenticate } from '../../middlewares/auth';
import { getPlayerActivityController } from '../../controllers/stats/stats.controller';

const router = Router();

router.use(authenticate);

router.get('/player/:playerId/activity', getPlayerActivityController);

export default router;