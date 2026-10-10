import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import logger from '../config/logger';

// Gerar ID único para cada request
export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  req.id = uuidv4();
  
  const startTime = Date.now();
  
  // Log da requisição
  logger.info('Incoming request', {
    requestId: req.id,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });

  // Log da resposta
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logger.info('Request completed', {
      requestId: req.id,
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
    });
  });

  next();
}

// Validar Content-Type para POST/PUT
export function validateContentType(req: Request, res: Response, next: NextFunction): void {
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const contentType = req.get('content-type');
    if (!contentType?.includes('application/json')) {
      res.status(415).json({
        success: false,
        error: {
          code: 'INVALID_CONTENT_TYPE',
          message: 'Content-Type deve ser application/json',
        },
        timestamp: new Date(),
        requestId: req.id,
      });
      return;
    }
  }
  next();
}

// Adicionar variáveis de contexto
export function contextMiddleware(req: Request, res: Response, next: NextFunction): void {
  req.context = {
    requestId: req.id,
    userId: req.userId,
    ip: req.ip || 'unknown',
    userAgent: req.get('user-agent') || 'unknown',
    timestamp: new Date(),
  };
  next();
}

// Estender Express Request
declare global {
  namespace Express {
    interface Request {
      id: string;
      context?: {
        requestId: string;
        userId?: string;
        ip: string;
        userAgent: string;
        timestamp: Date;
      };
    }
  }
}
