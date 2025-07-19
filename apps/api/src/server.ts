import express from 'express';
import cors from 'cors';
import { createServer as createHTTPServer } from 'http';
import { env } from '@dc-beauty/config';
import { logger } from '@dc-beauty/utils';

// Middleware imports
import { resolveTenant } from './middleware/resolveTenant';
import { resolveLanguage } from './middleware/resolveLanguage';

// Route imports
import servicesRouter from './routes/services';
import tenantExampleRouter from './routes/tenantExample';
import publicBookingRouter from './routes/publicBooking';
import messagingRouter from './routes/messaging';

// Messaging system imports
import { WebChatChannel } from './messaging/channels/WebChatChannel';
import { MessageHub } from './messaging/MessageHub';

export const createServer = () => {
  const app = express();
  const httpServer = createHTTPServer(app);

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

  // Language resolution (after tenant, for localized responses)
  app.use(resolveLanguage);

  // Initialize WebChat if enabled
  if (process.env.WEBCHAT_ENABLED === 'true') {
    const webChatConfig = {
      enabled: true,
      allowedOrigins: process.env.NODE_ENV === 'development' 
        ? ['http://localhost:5173', 'http://localhost:5174']
        : ['https://beauty.designcorp.eu'],
      maxConnections: parseInt(process.env.WEBCHAT_MAX_CONNECTIONS || '1000'),
      roomPrefix: 'beauty-salon'
    };

    const webChatChannel = new WebChatChannel(httpServer, webChatConfig);
    
    // Make WebChat available globally for other services
    (app as any).webChatChannel = webChatChannel;
    
    logger.info('WebChat channel initialized', { 
      maxConnections: webChatConfig.maxConnections,
      allowedOrigins: webChatConfig.allowedOrigins.length 
    });
  }

  // Health check (no tenant required)
  app.get('/health', (_req, res) => {
    res.json({ 
      ok: true, 
      timestamp: new Date().toISOString(),
      version: '0.1.0',
      features: ['TP-01', 'TP-02', 'TP-03', 'TP-04', 'TP-05', 'TP-06'],
      messaging: {
        enabled: true,
        channels: ['TELEGRAM', 'EMAIL', 'WEB_CHAT'],
        webChatEnabled: process.env.WEBCHAT_ENABLED === 'true'
      }
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
        messaging: '/api/v1/messaging/*',
        webhooks: '/api/v1/messaging/webhooks/*',
        public: '/public/:slug/*',
        examples: '/api/v1/examples'
      },
      websocket: {
        webChat: '/api/v1/messaging/webchat/socket.io',
        enabled: process.env.WEBCHAT_ENABLED === 'true'
      }
    });
  });

  // API v1 routes (private, tenant-scoped)
  app.use('/api/v1/services', servicesRouter);
  app.use('/api/v1/examples', tenantExampleRouter);
  app.use('/api/v1/messaging', messagingRouter);

  // Public routes (tenant resolved by slug)
  app.use('/public', publicBookingRouter);

  // 404 handler
  app.use((_req, res) => {
    res.status(404).json({ 
      error: 'Endpoint not found',
      hint: 'Check /health for available endpoints',
      availableEndpoints: [
        '/health',
        '/api/v1/services',
        '/api/v1/messaging/*',
        '/public/:slug/*'
      ]
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

  // Return both app and httpServer for Socket.io
  return { app, httpServer };
};

// Update index.ts to use the new server structure
export const startServer = async () => {
  const { app, httpServer } = createServer();
  
  const port = process.env.PORT || 4000;
  
  return new Promise<void>((resolve) => {
    httpServer.listen(port, () => {
      logger.info(`Beauty Platform API Server started`, {
        port,
        env: process.env.NODE_ENV,
        features: ['TP-01', 'TP-02', 'TP-03', 'TP-04', 'TP-05', 'TP-06'],
        messaging: {
          enabled: true,
          webChatEnabled: process.env.WEBCHAT_ENABLED === 'true'
        }
      });
      resolve();
    });
  });
};
