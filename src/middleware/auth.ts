import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config/environment';
import logger from '../config/logger';

export function authenticateToken(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Token de acesso ausente' },
      timestamp: new Date(),
      requestId: req.id,
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret) as { userId?: string; username?: string };
    req.userId = decoded.userId || null;
    req.context = {
      ...(req.context || {}),
      userId: req.userId || undefined,
    };
    logger.info(`Usuário autenticado: ${decoded.username || req.userId || 'desconhecido'}`);
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      error: { code: 'INVALID_TOKEN', message: 'Token inválido ou expirado' },
      timestamp: new Date(),
      requestId: req.id,
    });
  }
}

declare global {
  namespace Express {
    interface Request {
      userId?: string | null;
      id: string;
      context?: {
        userId?: string | null;
        requestId?: string;
      };
    }
  }
}
