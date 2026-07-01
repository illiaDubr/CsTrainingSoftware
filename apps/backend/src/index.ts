import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config/app';
import { db, testConnection } from './config/database';
import { errorHandler } from './middlewares/errorHandler';
import { notFound } from './middlewares/notFound';
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import groupRoutes from './routes/groups';
import taskRoutes from './routes/tasks';
import trainingRoutes from './routes/trainings';
import materialRoutes from './routes/materials';
import routineRoutes from './routes/routines';
import statsRoutes from './routes/stats';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/trainings', trainingRoutes);
app.use('/api/materials', materialRoutes);
app.use('/api/routines', routineRoutes);
app.use('/api/stats', statsRoutes);

app.use(notFound);
app.use(errorHandler);

const start = async () => {
  await testConnection();

  if (process.env.NODE_ENV === 'production') {
    console.log('🔄 Running migrations...');
    await db.migrate.latest({
      directory: './migrations',
    });
    console.log('✅ Migrations done');
  }

  app.listen(config.port, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${config.port}`);
  });
};

start();