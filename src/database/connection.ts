import pg, { Pool } from 'pg';
import config from '../config/environment';
import logger from '../config/logger';

export const pool: Pool = new pg.Pool({
  host: config.database.host,
  port: config.database.port,
  database: config.database.name,
  user: config.database.user,
  password: config.database.password,
  ssl: config.database.ssl ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err: Error) => {
  logger.error('Erro no pool PostgreSQL:', err);
});

export async function testConnection(): Promise<boolean> {
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    logger.info('Conexão com PostgreSQL OK');
    return true;
  } catch (error) {
    logger.warn('PostgreSQL indisponível; continuando em modo mínimo.');
    logger.warn(String(error));
    return false;
  }
}

export async function query(text: string, params?: any[]) {
  try {
    return await pool.query(text, params || []);
  } catch (error) {
    logger.error('Erro na query do banco:', { text, params, error });
    throw error;
  }
}

export async function closePool(): Promise<void> {
  await pool.end();
}
