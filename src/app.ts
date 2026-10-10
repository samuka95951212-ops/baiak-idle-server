import express from 'express';
import path from 'path';
import cors from 'cors';
import compression from 'compression';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config/environment';
import logger from './config/logger';
import { requestIdMiddleware, contextMiddleware, validateContentType } from './middleware/request';
import { authenticateToken } from './middleware/auth';
import { errorHandler, notFoundHandler } from './middleware/error';
import authRoutes from './routes/auth';
import playerRoutes from './routes/player';
import huntsRoutes from './routes/hunts';
import offlineRoutes from './routes/offline';
import paymentRoutes from './routes/payment';
import scheduler from './services/scheduler';

export async function createApp() {
  const app = express();

  // Segurança
  app.use(helmet());
  app.use(compression());
  app.use(cors({
    origin: config.security.corsOrigin,
    credentials: true,
  }));

  // Parsers
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Middlewares
  app.use(requestIdMiddleware);
  app.use(contextMiddleware);
  app.use(validateContentType);

  // Rate limiting
  app.use(rateLimit({
    windowMs: config.security.rateLimitWindow * 60 * 1000,
    max: config.security.rateLimitMaxRequests,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      error: {
        code: 'RATE_LIMITED',
        message: 'Muitas requisições em pouco tempo. Tente novamente mais tarde.',
      },
      timestamp: new Date(),
    },
  }));

  // Servir arquivos estáticos do frontend
  app.use(express.static(path.join(__dirname, '../public')));

  // Health check
  app.get('/api/health', (_req, res) => {
    res.status(200).json({
      success: true,
      data: {
        status: 'ok',
        service: '🔥 Baiak Conquest',
        timestamp: new Date(),
      },
      requestId: _req.id,
    });
  });

  // Rotas da API
  app.use('/api/auth', authRoutes);
  app.use('/api/player', authenticateToken, playerRoutes);
  app.use('/api/hunts', huntsRoutes);
  app.use('/api/offline', authenticateToken, offlineRoutes);
  app.use('/api/payments', paymentRoutes);

  // Serve index.html para SPA
  app.get('/', (_req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
  });

  // Handlers
  app.use(notFoundHandler);
  app.use(errorHandler);

  // Iniciar scheduler
  scheduler.start();

  return app;
}
