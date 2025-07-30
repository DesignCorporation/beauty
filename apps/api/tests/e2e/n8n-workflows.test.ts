import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../../src/server';
import { prisma } from '@dc-beauty/db';
import fs from 'fs';
import path from 'path';

describe('TP-08: n8n Workflows Integration', () => {
  const API_KEY = process.env.INTERNAL_API_KEY || 'test-api-key';
  const headers = {
    'x-api-key': API_KEY,
    'x-tenant-id': 'salon_test_123',
    'Content-Type': 'application/json'
  };

  beforeAll(async () => {
    // Создаем тестовый салон и данные
    await prisma.salon.upsert({
      where: { id: 'salon_test_123' },
      update: {},
      create: {
        id: 'salon_test_123',
        nip: '1234567890',
        displayName: 'Test Salon TP-08',
        slug: 'test-salon-tp08',
        primaryLocale: 'pl',
        supportedLocales: ['pl', 'en', 'ru'],
        baseCurrency: 'PLN'
      }
    });

    // Создаем тестовых клиентов для workflows
    await prisma.client.createMany({
      data: [
        {
          id: 'client_reminder_24h',
          salonId: 'salon_test_123',
          name: 'Anna Kowalska',
          phone: '+48123456789',
          email: 'anna@example.com',
          preferredLocale: 'pl'
        },
        {
          id: 'client_reminder_2h',
          salonId: 'salon_test_123', 
          name: 'Maria Nowak',
          phone: '+48987654321',
          email: 'maria@example.com',
          preferredLocale: 'pl'
        },
        {
          id: 'client_birthday',
          salonId: 'salon_test_123',
          name: 'Katarzyna Wiśniewska',
          phone: '+48555666777',
          email: 'katarzyna@example.com',
          preferredLocale: 'pl',
          birthday: new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate())
        },
        {
          id: 'client_winback',
          salonId: 'salon_test_123',
          name: 'Joanna Kowalczyk',
          phone: '+48444555666',
          email: 'joanna@example.com', 
          preferredLocale: 'pl',
          lastVisitAt: new Date(Date.now() - 95 * 24 * 60 * 60 * 1000) // 95 days ago
        }
      ],
      skipDuplicates: true
    });

    // Создаем тестовые записи для reminders
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const in2hours = new Date(Date.now() + 2 * 60 * 60 * 1000);

    await prisma.appointment.createMany({
      data: [
        {
          id: 'appointment_24h',
          salonId: 'salon_test_123',
          clientId: 'client_reminder_24h',
          startAt: tomorrow,
          endAt: new Date(tomorrow.getTime() + 60 * 60 * 1000),
          status: 'CONFIRMED'
        },
        {
          id: 'appointment_2h', 
          salonId: 'salon_test_123',
          clientId: 'client_reminder_2h',
          startAt: in2hours,
          endAt: new Date(in2hours.getTime() + 60 * 60 * 1000),
          status: 'CONFIRMED'
        }
      ],
      skipDuplicates: true
    });
  });

  afterAll(async () => {
    // Очистка тестовых данных
    await prisma.appointment.deleteMany({ where: { salonId: 'salon_test_123' } });
    await prisma.client.deleteMany({ where: { salonId: 'salon_test_123' } });
    await prisma.salon.delete({ where: { id: 'salon_test_123' } });
  });

  describe('Internal API Endpoints', () => {
    test('GET /internal/appointments/24h - should return appointments for tomorrow', async () => {
      const response = await request(app)
        .get('/internal/appointments/24h')
        .set(headers)
        .expect(200);

      expect(response.body).toHaveProperty('appointments');
      expect(Array.isArray(response.body.appointments)).toBe(true);
      expect(response.body.appointments.length).toBeGreaterThan(0);
      
      const appointment = response.body.appointments[0];
      expect(appointment).toHaveProperty('id');
      expect(appointment).toHaveProperty('client');
      expect(appointment).toHaveProperty('startAt');
      expect(appointment.client).toHaveProperty('name');
      expect(appointment.client).toHaveProperty('preferredLocale');
    });

    test('GET /internal/appointments/2h - should return appointments in 2 hours', async () => {
      const response = await request(app)
        .get('/internal/appointments/2h')
        .set(headers)
        .expect(200);

      expect(response.body).toHaveProperty('appointments');
      expect(Array.isArray(response.body.appointments)).toBe(true);
      
      if (response.body.appointments.length > 0) {
        const appointment = response.body.appointments[0];
        expect(appointment).toHaveProperty('id');
        expect(appointment).toHaveProperty('client');
        expect(appointment.client).toHaveProperty('name');
      }
    });

    test('GET /internal/clients/birthday - should return clients with birthday today', async () => {
      const response = await request(app)
        .get('/internal/clients/birthday')
        .set(headers)
        .expect(200);

      expect(response.body).toHaveProperty('clients');
      expect(Array.isArray(response.body.clients)).toBe(true);
      expect(response.body.clients.length).toBeGreaterThan(0);
      
      const client = response.body.clients[0];
      expect(client).toHaveProperty('id');
      expect(client).toHaveProperty('name');
      expect(client).toHaveProperty('birthday');
      expect(client.name).toBe('Katarzyna Wiśniewska');
    });

    test('GET /internal/clients/winback - should return clients for winback (90+ days)', async () => {
      const response = await request(app)
        .get('/internal/clients/winback')
        .set(headers)
        .expect(200);

      expect(response.body).toHaveProperty('clients');
      expect(Array.isArray(response.body.clients)).toBe(true);
      expect(response.body.clients.length).toBeGreaterThan(0);
      
      const client = response.body.clients[0];
      expect(client).toHaveProperty('id');
      expect(client).toHaveProperty('name');
      expect(client).toHaveProperty('lastVisitAt');
      expect(client.name).toBe('Joanna Kowalczyk');
    });
  });

  describe('Messaging Integration', () => {
    test('POST /internal/messaging/send - should send message via n8n', async () => {
      const messageData = {
        salonId: 'salon_test_123',
        clientId: 'client_reminder_24h',
        channel: 'EMAIL',
        templateCode: 'reminder_24h',
        locale: 'pl',
        data: {
          clientName: 'Anna Kowalska',
          appointmentDate: '2025-07-20',
          appointmentTime: '14:00'
        }
      };

      const response = await request(app)
        .post('/internal/messaging/send')
        .set(headers)
        .send(messageData)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('messageId');
      expect(response.body).toHaveProperty('templateCode', 'reminder_24h');
    });

    test('POST /internal/messaging/send-bulk - should send bulk messages', async () => {
      const bulkData = {
        messages: [
          {
            salonId: 'salon_test_123',
            clientId: 'client_reminder_24h',
            channel: 'EMAIL',
            templateCode: 'reminder_24h',
            locale: 'pl',
            data: { clientName: 'Anna' }
          },
          {
            salonId: 'salon_test_123', 
            clientId: 'client_reminder_2h',
            channel: 'EMAIL',
            templateCode: 'reminder_2h',
            locale: 'pl',
            data: { clientName: 'Maria' }
          }
        ]
      };

      const response = await request(app)
        .post('/internal/messaging/send-bulk')
        .set(headers)
        .send(bulkData)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('sent');
      expect(response.body).toHaveProperty('failed');
      expect(response.body.sent).toBeGreaterThan(0);
    });
  });

  describe('Security & Error Handling', () => {
    test('Should reject requests without API key', async () => {
      await request(app)
        .get('/internal/appointments/24h')
        .set({ 'x-tenant-id': 'salon_test_123' })
        .expect(401);
    });

    test('Should reject requests without tenant ID', async () => {
      await request(app)
        .get('/internal/appointments/24h')
        .set({ 'x-api-key': API_KEY })
        .expect(400);
    });

    test('Should reject requests with invalid tenant ID', async () => {
      await request(app)
        .get('/internal/appointments/24h')
        .set({
          'x-api-key': API_KEY,
          'x-tenant-id': 'invalid_salon_id'
        })
        .expect(404);
    });

    test('Should handle empty results gracefully', async () => {
      // Создаем пустой салон
      await prisma.salon.upsert({
        where: { id: 'empty_salon' },
        update: {},
        create: {
          id: 'empty_salon',
          nip: '9999999999',
          displayName: 'Empty Salon',
          slug: 'empty-salon',
          primaryLocale: 'pl',
          supportedLocales: ['pl'],
          baseCurrency: 'PLN'
        }
      });

      const response = await request(app)
        .get('/internal/appointments/24h')
        .set({
          'x-api-key': API_KEY,
          'x-tenant-id': 'empty_salon'
        })
        .expect(200);

      expect(response.body.appointments).toEqual([]);
      
      // Очистка
      await prisma.salon.delete({ where: { id: 'empty_salon' } });
    });
  });

  describe('Rate Limiting', () => {
    test('Should handle rate limiting for bulk operations', async () => {
      const requests = Array.from({ length: 5 }, (_, i) => 
        request(app)
          .get('/internal/appointments/24h')
          .set(headers)
      );

      const responses = await Promise.all(requests);
      
      // Все запросы должны проходить (rate limit для internal API выше)
      responses.forEach(response => {
        expect([200, 429]).toContain(response.status);
      });
    });
  });

  describe('Data Filtering & Localization', () => {
    test('Should respect tenant isolation in all endpoints', async () => {
      // Создаем другой салон
      await prisma.salon.upsert({
        where: { id: 'other_salon' },
        update: {},
        create: {
          id: 'other_salon',
          nip: '5555555555',
          displayName: 'Other Salon',
          slug: 'other-salon',
          primaryLocale: 'en',
          supportedLocales: ['en'],
          baseCurrency: 'EUR'
        }
      });

      const response = await request(app)
        .get('/internal/appointments/24h')
        .set({
          'x-api-key': API_KEY,
          'x-tenant-id': 'other_salon'
        })
        .expect(200);

      // Не должно возвращать данные из salon_test_123
      expect(response.body.appointments).toEqual([]);
      
      // Очистка
      await prisma.salon.delete({ where: { id: 'other_salon' } });
    });

    test('Should return data in correct locale format', async () => {
      const response = await request(app)
        .get('/internal/clients/birthday')
        .set(headers)
        .expect(200);

      const client = response.body.clients[0];
      expect(client.preferredLocale).toBeDefined();
      expect(['pl', 'en', 'ru', 'uk']).toContain(client.preferredLocale);
    });
  });

  describe('Workflow Templates Validation', () => {
    test('Should validate workflow JSON structure', () => {
      const workflowFiles = [
        '../../docker/n8n/workflows/beauty-24h-reminder.json',
        '../../docker/n8n/workflows/beauty-2h-reminder.json', 
        '../../docker/n8n/workflows/beauty-birthday-wishes.json',
        '../../docker/n8n/workflows/beauty-winback-90d.json'
      ];

      workflowFiles.forEach(file => {
        const filePath = path.resolve(__dirname, file);
        expect(fs.existsSync(filePath)).toBe(true);
        
        const content = fs.readFileSync(filePath, 'utf8');
        expect(() => JSON.parse(content)).not.toThrow();
        
        const workflow = JSON.parse(content);
        expect(workflow).toHaveProperty('nodes');
        expect(workflow).toHaveProperty('connections');
        expect(Array.isArray(workflow.nodes)).toBe(true);
        expect(workflow.nodes.length).toBeGreaterThan(0);
      });
    });
  });
});
