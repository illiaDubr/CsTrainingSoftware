import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { authenticate } from '../../middlewares/auth';
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

// Просмотр — любой участник группы
router.get('/maps', getNadeMapsController);
router.get('/', getNadesController);

// Управление — тренер или помощник тренера этой группы (проверка в сервисе)
router.post('/', upload.array('images', 6), createNadeController);
router.patch('/:id', updateNadeController);
router.post('/:id/images', upload.array('images', 6), addNadeImagesController);
router.delete('/images/:imageId', deleteNadeImageController);
router.delete('/:id', deleteNadeController);

export default router;
