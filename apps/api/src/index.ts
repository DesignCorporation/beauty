import { env } from '@dc-beauty/config';
import { logger } from '@dc-beauty/utils';
import { createServer } from './server.js';

async function main() {
  try {
    // Optional: Test DB connection
    if (env.TEST_DB_CONNECTION) {
      const { prisma } = await import('@dc-beauty/db');
      await prisma.$connect();
      logger.info('Database connected successfully');
    }

    const server = createServer();
    
    server.listen(env.PORT, () => {
      logger.info(`🚀 API server running on port ${env.PORT}`);
      logger.info(`Environment: ${env.NODE_ENV}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

main();
