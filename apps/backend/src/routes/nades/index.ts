import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { authenticate, authorize } from '../../middlewares/auth';
import { UserRole } from '../../models/user.model';
import {
  getNadeMapsController,
  getNadesController,
  createNadeController,
  updateNadeController,
  addNadeImagesController,
  deleteNadeImageController,
  deleteNadeController,
} from '../../controllers/nades/nades.controller';

const NADES_DIR = path.join(process.cwd(), 'uploads', 'nades');
fs.mkdirSync(NADES_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, NADES_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    cb(null, `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024, files: 6 },
  fileFilter: (_req, file, cb) => {
    if (/^image\/(jpeg|png|webp|gif)$/.test(file.mimetype)) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  },
});

const router = Router();

router.use(authenticate);

// Просмотр — все роли (игрок видит раскидки тренеров своих групп)
router.get('/maps', getNadeMapsController);
router.get('/', getNadesController);

// Управление — только тренер
router.post('/', authorize(UserRole.COACH), upload.array('images', 6), createNadeController);
router.patch('/:id', authorize(UserRole.COACH), updateNadeController);
router.post('/:id/images', authorize(UserRole.COACH), upload.array('images', 6), addNadeImagesController);
router.delete('/images/:imageId', authorize(UserRole.COACH), deleteNadeImageController);
router.delete('/:id', authorize(UserRole.COACH), deleteNadeController);

export default router;
