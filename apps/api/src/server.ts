import express from 'express';
import cors from 'cors';
import { env } from '@dc-beauty/config';
import { logger } from '@dc-beauty/utils';

// Middleware imports
import { resolveTenant } from './middleware/resolveTenant';
import { resolveLanguage } from './middleware/resolveLanguage';

// Route imports
import servicesRouter from './routes/services';
import tenantExampleRouter from './routes/tenantExample';
import publicBookingRouter from './routes/publicBooking';

export const createServer = () => {
  const app = express();

  // Global middleware
  app.use(cors({
    origin: process.env.NODE_ENV === 'development' 
      ? ['http://localhost:5173', 'http://localhost:5174']
      : ['https://beauty.designcorp.eu'],
    credentials: true
  }));
  
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Request logging in development
  if (process.env.NODE_ENV === 'development') {
    app.use((req, _res, next) => {
      console.log(`${req.method} ${req.path}`, {
        query: req.query,
        tenant: req.tenant?.salonId,
        locale: req.resolvedLocale
      });
      next();
    });
  }

  // Tenant resolution (runs on all routes)
  app.use(resolveTenant);

  // Health check (no tenant required)
  app.get('/health', (_req, res) => {
    res.json({ 
      ok: true, 
      timestamp: new Date().toISOString(),
      version: '0.1.0',
      features: ['TP-01', 'TP-02', 'TP-03', 'TP-04', 'TP-05']
    });
  });

  app.get('/', (_req, res) => {
    res.json({ 
      message: 'Beauty Platform API',
      version: '0.1.0',
      documentation: 'https://github.com/DesignCorporation/beauty',
      endpoints: {
        health: '/health',
        services: '/api/v1/services',
        public: '/public/:slug/*',
        examples: '/api/v1/examples'
      }
    });
  });

  // API v1 routes (private, tenant-scoped)
  app.use('/api/v1/services', servicesRouter);
  app.use('/api/v1/examples', tenantExampleRouter);

  // Public routes (tenant resolved by slug)
  app.use('/public', publicBookingRouter);

  // 404 handler
  app.use((_req, res) => {
    res.status(404).json({ 
      error: 'Endpoint not found',
      hint: 'Check /health for available endpoints'
    });
  });

  // Global error handler
  app.use((err: Error, req: express.Request, res: express.Response, _next: express.NextFunction) => {
    logger.error('API Error:', {
      error: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method,
      tenant: req.tenant?.salonId
    });

    res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined,
      requestId: Math.random().toString(36).substring(7)
    });
  });

  return app;
};
