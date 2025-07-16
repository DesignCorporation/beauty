import express from 'express';
import cors from 'cors';
import { env } from '@dc-beauty/config';
import { logger } from '@dc-beauty/utils';

export const createServer = () => {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());

  // Routes
  app.get('/health', (_req, res) => {
    res.json({ ok: true, timestamp: new Date().toISOString() });
  });

  app.get('/', (_req, res) => {
    res.json({ message: 'Beauty API ok', version: '0.0.0' });
  });

  // Error handler
  app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    logger.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
};
