// TP-02 T9: Basic tests for tenant middleware functionality

import request from 'supertest';
import { PrismaClient } from '@beauty/db';
import { clearSalonConfigCache } from '../lib/salonConfig';

// Mock Express app for testing
import express from 'express';
import { resolveTenant } from '../middleware/resolveTenant';
import { requireTenant } from '../middleware/requireTenant';
import tenantExampleRouter from '../routes/tenantExample';
import publicBookingRouter from '../routes/publicBooking';

const app = express();
app.use(express.json());

// Apply tenant middleware globally
app.use(resolveTenant);

// Mount routes
app.use('/api/v1', tenantExampleRouter);
app.use('/public', publicBookingRouter);

// Test health endpoint (no tenant required)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', tenant: req.tenant?.salonId || null });
});

describe('TP-02 Tenant Middleware Tests', () => {
  let prisma: PrismaClient;
  let testSalonA: any;
  let testSalonB: any;
  let testClientA: any;
  let testClientB: any;

  beforeAll(async () => {
    prisma = new PrismaClient();
    
    // Create test salons
    testSalonA = await prisma.salon.create({
      data: {
        nip: '1234567890',
        slug: 'test-salon-a',
        displayName: 'Test Salon A',
        primaryLocale: 'pl',
        supportedLocales: ['pl', 'en'],
        plan: 'STARTER'
      }
    });

    testSalonB = await prisma.salon.create({
      data: {
        nip: '0987654321',
        slug: 'test-salon-b',
        displayName: 'Test Salon B',
        primaryLocale: 'en',
        supportedLocales: ['en', 'ru'],
        plan: 'PRO'
      }
    });

    // Create test clients in each salon
    testClientA = await prisma.client.create({
      data: {
        salonId: testSalonA.id,
        name: 'Client A',
        phone: '+48123456789',
        email: 'client-a@test.com'
      }
    });

    testClientB = await prisma.client.create({
      data: {
        salonId: testSalonB.id,
        name: 'Client B',
        phone: '+48987654321',
        email: 'client-b@test.com'
      }
    });
  });

  afterAll(async () => {
    // Cleanup test data
    await prisma.client.deleteMany({
      where: {
        OR: [
          { salonId: testSalonA.id },
          { salonId: testSalonB.id }
        ]
      }
    });

    await prisma.salon.deleteMany({
      where: {
        id: {
          in: [testSalonA.id, testSalonB.id]
        }
      }
    });

    await prisma.$disconnect();
  });

  beforeEach(() => {
    // Clear cache before each test
    clearSalonConfigCache();
  });

  describe('Tenant Resolution', () => {
    test('should resolve tenant from header (dev mode)', async () => {
      process.env.NODE_ENV = 'development';
      
      const response = await request(app)
        .get('/health')
        .set('x-tenant-id', testSalonA.id);

      expect(response.status).toBe(200);
      expect(response.body.tenant).toBe(testSalonA.id);
    });

    test('should resolve tenant from query parameter', async () => {
      const response = await request(app)
        .get('/health')
        .query({ salon: testSalonA.id });

      expect(response.status).toBe(200);
      expect(response.body.tenant).toBe(testSalonA.id);
    });

    test('should work without tenant for global endpoints', async () => {
      const response = await request(app)
        .get('/health');

      expect(response.status).toBe(200);
      expect(response.body.tenant).toBeNull();
    });
  });

  describe('Tenant Isolation', () => {
    test('should return only clients from salon A', async () => {
      const response = await request(app)
        .get('/api/v1/clients')
        .set('x-tenant-id', testSalonA.id);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].id).toBe(testClientA.id);
      expect(response.body.meta.salonId).toBe(testSalonA.id);
    });

    test('should return only clients from salon B', async () => {
      const response = await request(app)
        .get('/api/v1/clients')
        .set('x-tenant-id', testSalonB.id);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].id).toBe(testClientB.id);
      expect(response.body.meta.salonId).toBe(testSalonB.id);
    });

    test('should return 400 when no tenant context for protected endpoint', async () => {
      const response = await request(app)
        .get('/api/v1/clients');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('TENANT_REQUIRED');
    });
  });

  describe('Public Booking with Slug', () => {
    test('should resolve tenant from slug and return services', async () => {
      // First create a test service
      const service = await prisma.service.create({
        data: {
          salonId: testSalonA.id,
          code: 'test-service',
          baseName: 'Test Service',
          durationMin: 60,
          priceAmount: 100,
          priceCurrency: 'PLN'
        }
      });

      const response = await request(app)
        .get(`/public/${testSalonA.slug}/services`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].code).toBe('test-service');
      expect(response.body.meta.salonSlug).toBe(testSalonA.slug);

      // Cleanup
      await prisma.service.delete({ where: { id: service.id } });
    });

    test('should return 404 for invalid slug', async () => {
      const response = await request(app)
        .get('/public/invalid-slug/services');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('SALON_NOT_FOUND');
    });
  });

  describe('Appointment Creation with Tenant Filtering', () => {
    test('should create appointment in correct salon context', async () => {
      // Create a test service first
      const service = await prisma.service.create({
        data: {
          salonId: testSalonA.id,
          code: 'haircut',
          baseName: 'Haircut',
          durationMin: 60,
          priceAmount: 80,
          priceCurrency: 'PLN'
        }
      });

      const appointmentData = {
        clientId: testClientA.id,
        startAt: '2025-07-20T10:00:00Z',
        endAt: '2025-07-20T11:00:00Z',
        serviceIds: [service.id],
        notes: 'Test appointment'
      };

      const response = await request(app)
        .post('/api/v1/appointments')
        .set('x-tenant-id', testSalonA.id)
        .send(appointmentData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.client.id).toBe(testClientA.id);
      expect(response.body.meta.salonId).toBe(testSalonA.id);

      // Verify appointment was created in correct salon
      const appointment = await prisma.appointment.findUnique({
        where: { id: response.body.data.id }
      });
      expect(appointment?.salonId).toBe(testSalonA.id);

      // Cleanup
      await prisma.appointmentService.deleteMany({
        where: { appointmentId: appointment!.id }
      });
      await prisma.appointment.delete({ where: { id: appointment!.id } });
      await prisma.service.delete({ where: { id: service.id } });
    });

    test('should not allow cross-tenant appointment creation', async () => {
      const appointmentData = {
        clientId: testClientB.id, // Client from salon B
        startAt: '2025-07-20T10:00:00Z',
        endAt: '2025-07-20T11:00:00Z',
        serviceIds: [],
        notes: 'Cross-tenant test'
      };

      const response = await request(app)
        .post('/api/v1/appointments')
        .set('x-tenant-id', testSalonA.id) // But using salon A context
        .send(appointmentData);

      // Should fail because clientB belongs to salonB, not salonA
      expect(response.status).toBe(500);
    });
  });

  describe('Public Booking Flow', () => {
    test('should create appointment via public booking', async () => {
      // Create a test service
      const service = await prisma.service.create({
        data: {
          salonId: testSalonB.id,
          code: 'manicure',
          baseName: 'Manicure',
          durationMin: 45,
          priceAmount: 60,
          priceCurrency: 'PLN'
        }
      });

      const bookingData = {
        client: {
          name: 'New Client',
          phone: '+48555666777',
          email: 'newclient@test.com',
          preferredLocale: 'en'
        },
        serviceCode: 'manicure',
        date: '2025-07-22',
        time: '14:00',
        notes: 'Public booking test'
      };

      const response = await request(app)
        .post(`/public/${testSalonB.slug}/appointments`)
        .send(bookingData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.client.name).toBe('New Client');
      expect(response.body.meta.salonSlug).toBe(testSalonB.slug);

      // Verify appointment was created in correct salon
      const appointment = await prisma.appointment.findUnique({
        where: { id: response.body.data.id },
        include: { client: true }
      });
      expect(appointment?.salonId).toBe(testSalonB.id);
      expect(appointment?.client.salonId).toBe(testSalonB.id);

      // Cleanup
      await prisma.appointmentService.deleteMany({
        where: { appointmentId: appointment!.id }
      });
      await prisma.appointment.delete({ where: { id: appointment!.id } });
      await prisma.client.delete({ where: { id: appointment!.client.id } });
      await prisma.service.delete({ where: { id: service.id } });
    });
  });
});

// Export for manual testing
export { app };
