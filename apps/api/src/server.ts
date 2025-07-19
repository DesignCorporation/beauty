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
import publicBookingRouter from './routes/publicBooking'; // Legacy - to be replaced
import publicRoutesV1 from './routes/public'; // TP-07: New public booking API
import n8nInternalRouter from './routes/n8nInternal'; // TP-08: n8n workflow integration

export const createServer = () => {
  const app = express();

  // Global middleware
  app.use(cors({
    origin: process.env.NODE_ENV === 'development' 
      ? ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5678']
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

  // Tenant resolution (runs on all routes except internal)
  app.use((req, res, next) => {
    if (req.path.startsWith('/internal/')) {
      // Skip tenant resolution for n8n internal endpoints
      return next();
    }
    resolveTenant(req, res, next);
  });

  // Health check (no tenant required)
  app.get('/health', (_req, res) => {
    res.json({ 
      ok: true, 
      timestamp: new Date().toISOString(),
      version: '0.1.0',
      features: ['TP-01', 'TP-02', 'TP-03', 'TP-04', 'TP-05', 'TP-06', 'TP-07', 'TP-08']
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
        examples: '/api/v1/examples',
        internal: '/internal/* (n8n workflows)'
      },
      features: {
        'TP-01': 'Database Schema & Multi-tenancy',
        'TP-02': 'Tenant Middleware & Security',
        'TP-03': 'Service Library & Currency Support',
        'TP-04': 'Onboarding API & Salon Passport',
        'TP-05': 'Language Resolver & Translation Bridge',
        'TP-06': 'Messaging Hub (Telegram, Email, Rate Limiting)',
        'TP-07': 'Booking API v1 (Public scheduling system)',
        'TP-08': 'n8n Workflows & Automation (Reminders, Birthday, Winback)'
      }
    });
  });

  // n8n Internal API routes (TP-08: No tenant middleware, uses API key auth)
  app.use('/internal', n8nInternalRouter);

  // API v1 routes (private, tenant-scoped)
  app.use('/api/v1/services', servicesRouter);
  app.use('/api/v1/examples', tenantExampleRouter);

  // Public routes (TP-07: Enhanced booking system)
  app.use('/public', publicRoutesV1);
  
  // Legacy public routes (backward compatibility - will be deprecated)
  app.use('/public-legacy', publicBookingRouter);

  // 404 handler
  app.use((_req, res) => {
    res.status(404).json({ 
      error: 'Endpoint not found',
      hint: 'Check /health for available endpoints',
      documentation: 'https://github.com/DesignCorporation/beauty'
    });
  });

  // Global error handler
  app.use((err: Error, req: express.Request, res: express.Response, _next: express.NextFunction) => {
    logger.error('API Error:', {
      error: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method,
      tenant: req.tenant?.salonId,
      publicTenant: req.publicTenant?.salonId
    });

    res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined,
      requestId: Math.random().toString(36).substring(7)
    });
  });

  return app;
};
