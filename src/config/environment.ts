import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  apiUrl: process.env.API_URL || 'http://localhost:3000',

  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    name: process.env.DB_NAME || 'baiak_idle',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    ssl: process.env.DB_SSL === 'true',
  },

  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'change_me_in_production',
    expiration: process.env.JWT_EXPIRATION || '7d',
  },

  backup: {
    hour: parseInt(process.env.BACKUP_HOUR || '12', 10),
    minute: parseInt(process.env.BACKUP_MINUTE || '0', 10),
    path: process.env.BACKUP_PATH || './backups',
  },

  payment: {
    provider: process.env.PAYMENT_PROVIDER || 'both',
    mercadoPagoAccessToken: process.env.MP_ACCESS_TOKEN || '',
    mercadoPagoPublicKey: process.env.MP_PUBLIC_KEY || '',
    mercadoPagoWebhookSecret: process.env.MP_WEBHOOK_SECRET || '',
    stripeSecretKey: process.env.STRIPE_SECRET_KEY || '',
    stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
    stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
  },

  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || './logs/app.log',
  },

  security: {
    corsOrigin: (process.env.CORS_ORIGIN || 'http://localhost:3000').split(','),
    rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW || '15', 10),
    rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },

  game: {
    harvest: {
      baseGold: parseInt(process.env.HARVEST_BASE_GOLD || '10', 10),
      maxGold: parseInt(process.env.HARVEST_MAX_GOLD || '30', 10),
    },
    attack: {
      costEnergy: parseInt(process.env.ATTACK_COST_ENERGY || '10', 10),
      baseDamage: parseInt(process.env.ATTACK_BASE_DAMAGE || '5', 10),
      maxDamage: parseInt(process.env.ATTACK_MAX_DAMAGE || '15', 10),
      baseGold: parseInt(process.env.ATTACK_BASE_GOLD || '20', 10),
      maxGold: parseInt(process.env.ATTACK_MAX_GOLD || '50', 10),
    },
    energy: {
      regenerationRate: parseInt(process.env.ENERGY_REGENERATION_RATE || '10', 10),
      regenerationInterval: parseInt(process.env.ENERGY_REGENERATION_INTERVAL || '300000', 10),
    },
  },
};

if (config.nodeEnv === 'production') {
  const requiredVars = ['JWT_SECRET', 'DB_USER', 'DB_PASSWORD'];
  requiredVars.forEach((envVar) => {
    if (!process.env[envVar]) {
      throw new Error(`Missing required environment variable: ${envVar}`);
    }
  });
}

export default config;