import { testConnection, closePool } from './database/connection';
import { config } from './config/environment';
import logger from './config/logger';
import { createApp } from './app';

async function bootstrap() {
  try {
    logger.info('🔥 Iniciando Baiak Conquest Server...');
    
    // Testar conexão com banco de dados
    await testConnection();

    // Criar app
    const app = await createApp();

    // Iniciar servidor
    const server = app.listen(config.port, () => {
      logger.info(`
╔══════════════════════════════════════╗
║  🔥 BAIAK CONQUEST - Server Online  ║
╠══════════════════════════════════════╣
║  🌐 API:    http://localhost:${config.port}/api       ║
║  🌍 Web:    http://localhost:${config.port}          ║
║  💾 DB:     ${config.database.name}@${config.database.host}:${config.database.port} ║
║  📦 Node:   ${config.nodeEnv.toUpperCase()}                  ║
╚══════════════════════════════════════╝
      `);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('SIGTERM recebido. Encerrando servidor...');
      server.close(async () => {
        await closePool();
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      logger.info('SIGINT recebido. Encerrando servidor...');
      server.close(async () => {
        await closePool();
        process.exit(0);
      });
    });
  } catch (error) {
    logger.error('❌ Falha ao iniciar o servidor:', error);
    process.exit(1);
  }
}

bootstrap();
