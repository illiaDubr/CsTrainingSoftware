import { Request, Response, NextFunction } from 'express';
import multer from 'multer';

export class AppError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
  }
}

export const errorHandler = (
  err: AppError | Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  console.error(err);

  let statusCode = err instanceof AppError ? err.statusCode : 500;
  let message = err instanceof AppError ? err.message : 'Internal Server Error';

  if (err instanceof multer.MulterError) {
    statusCode = err.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
    message = err.code === 'LIMIT_FILE_SIZE'
      ? 'Файл занадто великий. Максимальний розмір відео — 150 МБ, зображення — 10 МБ.'
      : `Помилка завантаження файлу: ${err.message}`;
  } else if (
    err.message === 'Unsupported video format'
    || err.message === 'Only image files are allowed'
  ) {
    statusCode = 400;
    message = err.message;
  }

  res.status(statusCode).json({
    success: false,
    message,
  });
};
