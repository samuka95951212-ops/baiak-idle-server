import express from 'express';
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
import paymentRoutes from './routes/payment';
import gameRoutes from './routes/game';
import scheduler from './services/scheduler';

export async function createApp() {
  const app = express();

  app.use(helmet());
  app.use(compression());
  app.use(cors({
    origin: config.security.corsOrigin,
    credentials: true,
  }));
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(requestIdMiddleware);
  app.use(contextMiddleware);
  app.use(validateContentType);

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

  app.get('/api/health', (_req, res) => {
    res.status(200).json({
      success: true,
      data: {
        status: 'ok',
        service: 'baiak-idle-server',
        timestamp: new Date(),
      },
      requestId: _req.id,
    });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/player', authenticateToken, playerRoutes);
  app.use('/api/game', authenticateToken, gameRoutes);
  app.use('/api/payments', paymentRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  scheduler.start();

  return app;
}
