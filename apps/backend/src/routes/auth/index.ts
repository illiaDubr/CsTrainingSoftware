import { Router } from 'express';

const router = Router();

router.post('/register', (_req, res) => {
  res.json({ message: 'register — todo' });
});

router.post('/login', (_req, res) => {
  res.json({ message: 'login — todo' });
});

router.post('/refresh', (_req, res) => {
  res.json({ message: 'refresh — todo' });
});

export default router;