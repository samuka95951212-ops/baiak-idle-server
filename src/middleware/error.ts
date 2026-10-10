import { Request, Response, NextFunction } from 'express';
import logger from '../config/logger';

export function errorHandler(err: any, req: Request, res: Response, _next: NextFunction): void {
  const status = err.statusCode || 500;
  const message = err.message || 'Erro interno do servidor';

  logger.error('Erro capturado no middleware', {
    requestId: req.id,
    status,
    message,
    stack: err.stack,
  });

  res.status(status).json({
    success: false,
    error: {
      code: err.errorCode || 'INTERNAL_ERROR',
      message,
    },
    timestamp: new Date(),
    requestId: req.id,
  });
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Rota não encontrada: ${req.method} ${req.originalUrl}`,
    },
    timestamp: new Date(),
    requestId: req.id,
  });
}
