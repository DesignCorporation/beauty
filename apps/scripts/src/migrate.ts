import { spawn } from 'child_process';
import { logger } from '@dc-beauty/utils';

function runMigration() {
  logger.info('🔄 Running database migrations...');
  
  const migrate = spawn('npx', ['prisma', 'migrate', 'deploy'], {
    cwd: process.cwd(),
    stdio: 'inherit',
  });

  migrate.on('close', (code) => {
    if (code === 0) {
      logger.info('✅ Migrations completed successfully');
    } else {
      logger.error(`❌ Migration failed with code ${code}`);
      process.exit(1);
    }
  });
}

runMigration();
