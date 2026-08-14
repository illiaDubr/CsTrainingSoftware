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
  getMapBackgroundController,
  setMapBackgroundController,
  deleteMapBackgroundController,
  setNadeVideoController,
  deleteNadeVideoController,
} from '../../controllers/nades/nades.controller';

const NADES_DIR = path.join(process.cwd(), 'uploads', 'nades');
fs.mkdirSync(NADES_DIR, { recursive: true });

const BACKGROUNDS_DIR = path.join(process.cwd(), 'uploads', 'map-backgrounds');
fs.mkdirSync(BACKGROUNDS_DIR, { recursive: true });

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

const backgroundStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, BACKGROUNDS_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    cb(null, `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`);
  },
});

const uploadBackground = multer({
  storage: backgroundStorage,
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (/^image\/(jpeg|png|webp|gif)$/.test(file.mimetype)) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  },
});

const VIDEO_MAX_SIZE = 150 * 1024 * 1024;
const isVideoMime = (mimetype: string) => /^video\/(mp4|quicktime|webm|x-matroska|3gpp)$/.test(mimetype);
const isImageMime = (mimetype: string) => /^image\/(jpeg|png|webp|gif)$/.test(mimetype);

// Создание раскидки: до 6 скриншотов + опционально один видеофайл в том же запросе
const uploadCreate = multer({
  storage,
  limits: { fileSize: VIDEO_MAX_SIZE, files: 7 },
  fileFilter: (_req, file, cb) => {
    if (file.fieldname === 'video') {
      if (isVideoMime(file.mimetype)) cb(null, true);
      else cb(new Error('Unsupported video format'));
    } else if (isImageMime(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
}).fields([{ name: 'images', maxCount: 6 }, { name: 'video', maxCount: 1 }]);

// Замена видео у уже существующей раскидки
const uploadVideo = multer({
  storage,
  limits: { fileSize: VIDEO_MAX_SIZE, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (isVideoMime(file.mimetype)) cb(null, true);
    else cb(new Error('Unsupported video format'));
  },
});

const router = Router();

router.use(authenticate);

// Просмотр — любой участник группы
router.get('/maps', getNadeMapsController);
router.get('/', getNadesController);
router.get('/background', getMapBackgroundController);

// Управление — тренер или помощник тренера этой группы (проверка в сервисе)
router.post('/', uploadCreate, createNadeController);
router.patch('/:id', updateNadeController);
router.post('/:id/images', upload.array('images', 6), addNadeImagesController);
router.delete('/images/:imageId', deleteNadeImageController);
router.post('/:id/video', uploadVideo.single('video'), setNadeVideoController);
router.delete('/:id/video', deleteNadeVideoController);
router.delete('/:id', deleteNadeController);

router.put('/background', uploadBackground.single('image'), setMapBackgroundController);
router.delete('/background', deleteMapBackgroundController);

export default router;
